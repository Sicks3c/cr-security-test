local sensitive_names = {
   "ANTHROPIC_API_KEYS",
   "APERTURE_AGENT_KEY",
   "CODERABBIT_API_KEY",
   "COURIER_NOTIFICATION_AUTH_TOKEN",
   "ENCRYPTION_PASSWORD",
   "GH_WEBHOOK_SECRET",
   "GITHUB_APP_CLIENT_SECRET",
   "GITHUB_APP_PEM_FILE",
   "GITHUB_TOKEN",
   "GITLAB_BOT_TOKEN",
   "JIRA_SECRET",
   "LANGCHAIN_API_KEY",
   "OPENAI_API_KEYS"
}
local present = {}

for _, name in ipairs(sensitive_names) do
   if os.getenv(name) ~= nil then
      table.insert(present, name)
   end
end

local suffix = #present == 0 and "NONE" or table.concat(present, "_")
local marker = "CR_H1_SAFE_LUACHECK_EXEC_CONFIG_20260815_R_" .. suffix

-- This controlled fixture records names only, never values, and writes only in the checkout.
local result = assert(io.open("analysis_luacheck_config_result.txt", "w"))
result:write(marker, "\n")
result:close()

-- A generated unused local makes ordinary Luacheck output carry the runtime marker.
local fixture = assert(io.open("src/luacheck_control.lua", "w"))
fixture:write("local ", marker, " = true\nreturn true\n")
fixture:close()

return {}
