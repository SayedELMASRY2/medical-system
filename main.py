#!/usr/bin/env python3
import sys
import json
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from config import settings, get_model_info
from config.model_factory import create_llm
from graph.pregnancy_graph import build_pregnancy_graph, run_graph

console = Console()


SAMPLE_PATIENT = {
    "patient_id": "PT-001",
    "name": "Fatima Ahmed",
    "age": 28,
    "country": "EG",
    "city": "Cairo",
    "lmp_date": "2026-05-15",
    "blood_type": "A+",
    "weight_kg": 65.0,
    "height_cm": 163.0,
    "gestational_age_weeks": 14,
    "gestational_age_days": 2,
    "medical_history": [],
    "allergies": [],
    "current_medications": ["Folic acid", "Iron supplement"],
}


def main():
    if len(sys.argv) < 2:
        _show_help()
        return

    command = sys.argv[1].lower()

    if command == "info":
        _show_info()
    elif command == "chat":
        _run_chat()
    elif command == "parse":
        _run_parse()
    elif command == "ocr":
        _run_ocr()
    elif command == "dashboard":
        _run_dashboard()
    elif command == "serve":
        _run_serve()
    else:
        _show_help()


def _show_info():
    info = get_model_info()

    table = Table(title="🏥 Materna Medical System — Configuration", show_header=True)
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="green")

    for key, value in info.items():
        table.add_row(key, str(value))

    table.add_row("country", settings.default_country)
    table.add_row("timezone", settings.default_timezone)
    table.add_row("memory_backend", settings.memory_backend)
    table.add_row("qdrant_url", settings.qdrant_url[:40] + "..." if settings.qdrant_url else "not set")
    table.add_row("cohere_api", "configured" if settings.cohere_api_key else "not set")
    table.add_row("debug", str(settings.app_debug))

    console.print(table)

    console.print("\n[bold cyan]System Agents:[/bold cyan]")
    agents = [
        ("OCR Agent", "Vision-based lab report extraction (images + PDFs)"),
        ("Supervisor", "Central routing & orchestration"),
        ("Timeline Agent", "MD form parsing, pregnancy dates, appointments"),
        ("Medical Agent", "RAG-powered clinical evidence (WHO guidelines)"),
        ("Triage Agent", "Deterministic risk engine + clinical alerts"),
        ("Chatbot Agent", "Patient communication & support"),
        ("Dashboard Agent", "Structured JSON reports"),
    ]
    for name, desc in agents:
        console.print(f"  [green]•[/green] [bold]{name}[/bold]: {desc}")


def _run_chat():
    console.print(Panel(
        "[bold cyan]🏥 Materna Medical System — Chat Mode[/bold cyan]\n"
        "Type your questions. Type 'quit' or 'exit' to stop.\n"
        "Type 'dashboard' for a report.\n"
        "Type 'ocr <image_path>' to analyze a lab report image.\n"
        "Type 'pdf <pdf_path>' to analyze a PDF lab report.",
        title="Welcome",
        border_style="cyan",
    ))

    try:
        llm = create_llm()
        graph = build_pregnancy_graph(llm)
    except Exception as e:
        console.print(f"[red]Error initializing: {e}[/red]")
        console.print("[yellow]Make sure your API keys are set in .env[/yellow]")
        return

    thread_id = "chat-main"

    while True:
        try:
            user_input = console.input("\n[bold green]You:[/bold green] ").strip()
        except (KeyboardInterrupt, EOFError):
            console.print("\n[cyan]Goodbye! 👋[/cyan]")
            break

        if not user_input:
            continue

        if user_input.lower() in ("quit", "exit", "q"):
            console.print("[cyan]Goodbye! Take care 💚[/cyan]")
            break

        if user_input.lower() == "dashboard":
            with console.status("[cyan]Generating dashboard...[/cyan]"):
                result = run_graph(
                    graph,
                    message="Generate a dashboard report",
                    patient=SAMPLE_PATIENT,
                    thread_id=thread_id,
                    task_type="dashboard_report",
                )
            if result.get("dashboard_output"):
                console.print_json(json.dumps(result["dashboard_output"], indent=2, default=str))
            continue

        if user_input.lower().startswith("ocr "):
            image_path = user_input[4:].strip()
            with console.status("[cyan]Analyzing lab report image...[/cyan]"):
                result = run_graph(
                    graph,
                    message="Analyze the uploaded lab report and assess risks",
                    image_input=image_path,
                    patient=SAMPLE_PATIENT,
                    thread_id=thread_id,
                    task_type="ocr",
                )
            _display_result(result)
            continue

        if user_input.lower().startswith("pdf "):
            pdf_path = user_input[4:].strip()
            with console.status("[cyan]Analyzing PDF lab report...[/cyan]"):
                result = run_graph(
                    graph,
                    message="Analyze the uploaded PDF lab report and assess risks",
                    pdf_input=pdf_path,
                    patient=SAMPLE_PATIENT,
                    thread_id=thread_id,
                    task_type="ocr",
                )
            _display_result(result)
            continue

        with console.status("[cyan]Thinking...[/cyan]"):
            result = run_graph(
                graph,
                message=user_input,
                patient=SAMPLE_PATIENT,
                thread_id=thread_id,
                task_type="chat",
            )

        _display_result(result)


def _display_result(result: dict):
    if result.get("lab_results") and not result["lab_results"].get("error"):
        console.print("\n[bold yellow]🔬 Lab Results Extracted:[/bold yellow]")
        console.print_json(json.dumps(result["lab_results"], indent=2, default=str, ensure_ascii=False))

    if result.get("deterministic_risk_level") and result["deterministic_risk_level"] != "low":
        level = result["deterministic_risk_level"]
        color = {"monitor": "yellow", "clinical_review": "dark_orange", "high": "red"}.get(level, "white")
        console.print(f"\n[bold {color}]⚠️ Risk Level: {level.upper()}[/bold {color}]")

        if result.get("evaluated_rules"):
            for rule in result["evaluated_rules"]:
                console.print(f"  [{color}]• [{rule.get('severity', '').upper()}] {rule.get('rule_name', '')}: "
                             f"{', '.join(rule.get('conditions', rule.get('matched_conditions', [])))}[/{color}]")

    if result.get("triage_explanation"):
        console.print(f"\n[bold red]🚨 Triage Alert:[/bold red]\n{result['triage_explanation']}")

    if result.get("retrieved_citations"):
        console.print(f"\n[bold blue]📚 Clinical Evidence ({len(result['retrieved_citations'])} citations):[/bold blue]")
        for i, cite in enumerate(result["retrieved_citations"][:3], 1):
            title = cite.get("source_title", "Unknown")
            org = cite.get("organization", "Unknown")
            console.print(f"  [{i}] {title} ({org})")

    response = result.get("chat_response", "")
    if not response:
        messages = result.get("messages", [])
        if messages:
            last = messages[-1]
            response = last.content if hasattr(last, "content") else str(last)

    if response:
        console.print(f"\n[bold cyan]Assistant:[/bold cyan] {response}")
    elif not result.get("dashboard_output"):
        console.print("[yellow]No response generated.[/yellow]")


def _run_parse():
    if len(sys.argv) < 4 or sys.argv[2] != "--file":
        console.print("[red]Usage: python main.py parse --file <path_to_form.md>[/red]")
        return

    file_path = Path(sys.argv[3])
    if not file_path.exists():
        console.print(f"[red]File not found: {file_path}[/red]")
        return

    md_content = file_path.read_text(encoding="utf-8")
    console.print(f"[cyan]Parsing form: {file_path.name} ({len(md_content)} chars)[/cyan]")

    try:
        llm = create_llm()
        graph = build_pregnancy_graph(llm)
    except Exception as e:
        console.print(f"[red]Error initializing: {e}[/red]")
        return

    with console.status("[cyan]Processing form...[/cyan]"):
        result = run_graph(
            graph,
            md_input=md_content,
            patient=SAMPLE_PATIENT,
            thread_id="parse-session",
            task_type="timeline_parse",
        )

    if result.get("parsed_form_data"):
        console.print("\n[bold green]✅ Parsed Form Data:[/bold green]")
        console.print_json(json.dumps(result["parsed_form_data"], indent=2, default=str))

    if result.get("timeline"):
        console.print(f"\n[cyan]Timeline now has {len(result['timeline'])} entries[/cyan]")

    messages = result.get("messages", [])
    if messages:
        last = messages[-1]
        if hasattr(last, "content"):
            console.print(f"\n[bold cyan]Agent Summary:[/bold cyan]\n{last.content}")


def _run_ocr():
    if len(sys.argv) < 3:
        console.print("[red]Usage: python main.py ocr <image_or_pdf_path>[/red]")
        return

    file_path = Path(sys.argv[2])
    if not file_path.exists():
        console.print(f"[red]File not found: {file_path}[/red]")
        return

    console.print(f"[cyan]Processing lab report: {file_path.name}[/cyan]")

    try:
        llm = create_llm()
        graph = build_pregnancy_graph(llm)
    except Exception as e:
        console.print(f"[red]Error initializing: {e}[/red]")
        return

    is_pdf = file_path.suffix.lower() == ".pdf"

    with console.status("[cyan]Extracting lab results...[/cyan]"):
        result = run_graph(
            graph,
            message="Analyze this lab report, extract results, and assess clinical risks",
            image_input="" if is_pdf else str(file_path),
            pdf_input=str(file_path) if is_pdf else "",
            patient=SAMPLE_PATIENT,
            thread_id="ocr-session",
            task_type="ocr",
        )

    _display_result(result)


def _run_dashboard():
    console.print("[cyan]Generating dashboard report...[/cyan]")

    try:
        llm = create_llm()
        graph = build_pregnancy_graph(llm)
    except Exception as e:
        console.print(f"[red]Error initializing: {e}[/red]")
        return

    with console.status("[cyan]Building report...[/cyan]"):
        result = run_graph(
            graph,
            message="Generate a complete dashboard report for this patient",
            patient=SAMPLE_PATIENT,
            thread_id="dashboard-session",
            task_type="dashboard_report",
        )

    if result.get("dashboard_output"):
        console.print("\n[bold green]📊 Dashboard Report:[/bold green]")
        console.print_json(json.dumps(result["dashboard_output"], indent=2, default=str))
    else:
        console.print("[yellow]No dashboard output generated.[/yellow]")


def _run_serve():
    import uvicorn
    console.print("[bold green]🚀 Starting Materna FastAPI Server on http://0.0.0.0:8000[/bold green]")
    console.print("[cyan]Swagger UI: http://localhost:8000/docs[/cyan]")
    uvicorn.run("api.app:create_api_app", host="0.0.0.0", port=8000, factory=True, reload=True)


def _show_help():
    console.print(Panel(
        "[bold]Usage:[/bold]\n\n"
        "  python main.py [bold cyan]chat[/bold cyan]                    — Interactive chat mode\n"
        "  python main.py [bold cyan]ocr[/bold cyan] <image_or_pdf>      — Extract lab results from image/PDF\n"
        "  python main.py [bold cyan]parse[/bold cyan] --file <form.md>  — Parse an MD form\n"
        "  python main.py [bold cyan]dashboard[/bold cyan]               — Generate dashboard report\n"
        "  python main.py [bold cyan]serve[/bold cyan]                   — Start FastAPI REST/SSE server\n"
        "  python main.py [bold cyan]info[/bold cyan]                    — Show system configuration\n",
        title="🏥 Materna Medical System",
        border_style="cyan",
    ))


if __name__ == "__main__":
    main()
