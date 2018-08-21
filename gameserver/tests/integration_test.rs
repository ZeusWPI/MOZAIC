
static LOG_FILE : &str = "not_the_log_file_you_are_looking_for.xml.rar.zip";
static CTRL_TOKEN : &str = "control-alt-delete";
static ADDRESS : &str = "127.0.0.1:6969";


#[test]
fn simple_server_test() {
    let test_config_json = format!("{{ \"log_file\":\"{}\", \"ctrl_token\":\"{}\", \"address\": \"{}\"}}", LOG_FILE, CTRL_TOKEN, ADDRESS);
    println!("{}", test_config_json);
    assert!(false);
}
