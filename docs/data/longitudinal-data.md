# Longitudinal Data Architecture

## Centrality to Materna
In maternal health, trends matter more than single point-in-time snapshots. An increasing blood pressure trend across three weeks is a far stronger predictor of preeclampsia than a single slightly elevated reading. The architecture is explicitly designed to capture and query these sequences.

## Patient Timeline Construction
Timelines are constructed by pulling asynchronous data streams (patient app entries, clinic vitals, lab integrations) and sorting them by `gestational_week` and `recorded_at`.

## Time-Series Storage Patterns
PostgreSQL handles the time-series requirements via standard relational tables indexed heavily on time and pregnancy ID. If volume grows, table partitioning by gestational week ranges or year can be introduced.

## Gestational Week Axis
The primary temporal axis is not the calendar date, but the `gestational_week`. All algorithms process data normalized to this axis to compare against clinical guidelines.

## Handling Irregular Intervals
Patients do not visit exactly every 7 days. The engine performs interpolation or backward-filling when generating `trend_features` for a given week. 

## Data Retention and Archival
When a pregnancy moves to `postpartum` and eventually `archived`, active monitoring ceases. Data remains accessible for historical research and subsequent pregnancies but is excluded from active alert queues.

## Example: Tracking BP (Weeks 20-31)
- Week 20: 110/70 (Baseline)
- Week 24: 115/72
- Week 28: 125/80 (Monitor flag triggered)
- Week 30: 135/85 (Clinical Review)
- Week 31: 145/92 (High Priority Alert)
The system analyzes this trajectory rather than just flagging the week 31 value.
