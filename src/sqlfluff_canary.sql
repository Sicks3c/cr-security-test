select *
from alpha as {{ presence_marker() }}
join beta as {{ presence_marker() }} on 1 = 1;
