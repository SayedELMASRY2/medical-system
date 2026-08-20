from typing import Any
from langchain_core.messages import HumanMessage, AIMessage
from config.model_factory import create_llm
from core.tools.date_tools import get_pregnancy_dates, get_nearest_appointment, get_holidays_by_country, summarize_checkin_trends
from core.tools.form_parser import parse_md_form
from prompts.timeline_prompt import TIMELINE_SYSTEM_PROMPT


TIMELINE_TOOLS = [
    parse_md_form,
    get_pregnancy_dates,
    get_nearest_appointment,
    get_holidays_by_country,
    summarize_checkin_trends,
]


def create_timeline_agent(llm=None):
    if llm is None:
        llm = create_llm()

    llm_with_tools = llm.bind_tools(TIMELINE_TOOLS)

    def timeline_node(state: dict[str, Any]) -> dict[str, Any]:
        messages = list(state.get("messages", []))

        system_msg = {"role": "system", "content": TIMELINE_SYSTEM_PROMPT}

        raw_md = state.get("raw_md_input", "")
        patient = state.get("patient", {})

        context_parts = []
        if patient:
            context_parts.append(f"Patient: {patient.get('name', 'Unknown')}")
            context_parts.append(f"Country: {patient.get('country', 'EG')}")
            if patient.get("lmp_date"):
                context_parts.append(f"LMP: {patient['lmp_date']}")

        if raw_md:
            task_msg = HumanMessage(content=(
                f"Parse the following daily pregnancy form and update the timeline.\n\n"
                f"Patient Context: {', '.join(context_parts)}\n\n"
                f"--- FORM CONTENT ---\n{raw_md}\n--- END FORM ---\n\n"
                f"After parsing, calculate the current gestational dates and find "
                f"the nearest appointment. Use the patient's country for holiday checking."
            ))
            messages.append(task_msg)

        response = llm_with_tools.invoke(
            [system_msg] + messages
        )

        tool_calls = getattr(response, "tool_calls", [])
        tool_results = _execute_tools(tool_calls)

        if tool_results:
            messages.append(response)
            for result in tool_results:
                messages.append(result)

            final_response = llm_with_tools.invoke(
                [system_msg] + messages
            )
            messages.append(final_response)
        else:
            messages.append(response)

        parsed_data = _extract_parsed_data(tool_results)

        timeline = list(state.get("timeline", []))
        if parsed_data:
            timeline.append(parsed_data)

        return {
            "messages": messages,
            "timeline": timeline,
            "parsed_form_data": parsed_data,
            "current_agent": "timeline_agent",
        }

    return timeline_node


def _execute_tools(tool_calls: list) -> list:
    from langchain_core.messages import ToolMessage

    tool_map = {tool.name: tool for tool in TIMELINE_TOOLS}
    results = []

    for call in tool_calls:
        tool_name = call["name"]
        tool_args = call["args"]

        if tool_name in tool_map:
            try:
                result = tool_map[tool_name].invoke(tool_args)
                results.append(ToolMessage(
                    content=str(result),
                    tool_call_id=call["id"],
                ))
            except Exception as e:
                results.append(ToolMessage(
                    content=f"Tool error: {str(e)}",
                    tool_call_id=call["id"],
                ))

    return results


def _extract_parsed_data(tool_results: list) -> dict:
    import json

    for result in tool_results:
        content = result.content if hasattr(result, "content") else str(result)
        try:
            data = json.loads(content.replace("'", '"'))
            if isinstance(data, dict) and ("date" in data or "parsed_at" in data):
                return data
        except (json.JSONDecodeError, AttributeError):
            continue

    return {}
