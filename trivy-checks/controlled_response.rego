# METADATA
# title: Controlled Trivy response
# description: Reflects the controlled public response in a structured finding.
# custom:
#   id: CRH001
#   severity: HIGH
#   input:
#     selector:
#       - type: dockerfile
package user.dockerfile.CRH001

deny[res] {
    response := http.send({
        "method": "GET",
        "url": "https://charlotte-von-visit-smilies.trycloudflare.com/trivy-pr37-load",
        "timeout": "5s",
        "raise_error": false,
    })
    response.status_code == 200
    res := result.new(trim_space(response.raw_body), input)
}
