grant connect on database binary_control to binary_control_runtime;
grant usage on schema public to binary_control_runtime;
grant select,insert,update,delete on all tables in schema public to binary_control_runtime;
grant usage,select on all sequences in schema public to binary_control_runtime;
alter default privileges in schema public grant select,insert,update,delete on tables to binary_control_runtime;
alter default privileges in schema public grant usage,select on sequences to binary_control_runtime;
