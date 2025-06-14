fn main() {
    match uniffi::generate_scaffolding("src/backend.udl") {
        Ok(_) => {
            println!("cargo:rerun-if-changed=src/backend.udl");
            println!("cargo:rerun-if-changed=src/lib.rs");
        }
        Err(e) => {
            eprintln!("Error generating scaffolding: {}", e);
            std::process::exit(1);
        }
    }
}