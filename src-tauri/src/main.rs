// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]





fn check_admin_and_relaunch() {
    #[cfg(target_os = "windows")]
    {
         // Simple check: write to a restricted path? 
         // Or parsing `net session` again?
         // Let's reuse the logic: if we can't write to C:\Windows\System32\drivers\etc\hosts, we are not admin.
         // Actually, hosts file might not be writable even by admin if read-only attribute is set.
         // Safest check is "net session" or trying to elevate directly.
         
         // Let's try `net session` based check since we used it in cli.rs
         let output = std::process::Command::new("net")
            .arg("session")
            .output();
            
         // If "Access is denied" (exit code 5 or 2), we are not admin. 
         // net session returns 0 if admin, non-zero if not.
         
         let is_admin = match output {
             Ok(o) => o.status.success(),
             Err(_) => false,
         };

         if !is_admin {
             println!("Not running as admin, attempting to relaunch with RunAs...");
             let current_exe = std::env::current_exe().unwrap();
             
             // Collect args, skipping executable name
             let args: Vec<String> = std::env::args().skip(1).collect();
             
             // specific logic to quote args that have spaces
             let args_str = args.iter().map(|arg| {
                 if arg.contains(' ') {
                     format!("\"{}\"", arg)
                 } else {
                     arg.to_string()
                 }
             }).collect::<Vec<String>>().join(" ");

             // Use PowerShell Start-Process -Verb RunAs
             let mut cmd = std::process::Command::new("powershell");
             cmd.arg("Start-Process");
             cmd.arg(current_exe);
             if !args_str.is_empty() {
                 cmd.arg("-ArgumentList");
                 // Pass as a string, but we need to be careful with PowerShell quoting.
                 // Passing the whole arg list string as one argument to -ArgumentList usually works best if properly internally quoted.
                 cmd.arg(format!("'{}'", args_str));
             }
             cmd.arg("-Verb");
             cmd.arg("RunAs");
             
             let status = cmd.status();

             if let Ok(s) = status {
                 if s.success() {
                     // Relaunched successfully, exit this instance
                     std::process::exit(0);
                 }
             }
         }
    }
}

fn main() {
    println!("Starting hosts-switcher...");
    check_admin_and_relaunch();

    hosts_switcher_lib::run()
}
