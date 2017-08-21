use std::process::{Command, Stdio, Child};
use std::io::{Write, Read, BufReader, BufRead};



fn main(){
    let cmds = vec![("python3 mocks/echo.py", 0), ("python3 mocks/echo.py", 0), ("python3 mocks/echo.py", 0)];
    
    let mut children: Vec<Child> = cmds.iter().enumerate().map(|(i, &(cmd, _))| {
        let bot = Command::new("bash")
            .arg("-c")
            .arg(format!("{} {}", cmd, i))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .expect("MOZAIC: Failed to execute process");
        bot
    }).collect();

    for x in 1..5 {
        for (i, child) in children.iter_mut().enumerate() {
            println!("X: {:?} | Child {}", x, i);
            let child_in = child.stdin.as_mut().unwrap();
            let mut child_out = BufReader::new(child.stdout.as_mut().unwrap());
            
            child_in.write_fmt(format_args!("{}\n", x));
            child_in.flush();
            let mut out = String::new();
            child_out.read_line(&mut out).unwrap();

            println!("{:?}", out)
        }
    }
}