import * as fs from "fs";
import * as path from "path";

export const readBotFilesAsNames = (): string[] => {
  let dir = "./bots";
  if (fs.existsSync(dir)) {
    let fileNames = fs.readdirSync(dir);
    fileNames = fileNames.filter(file => fs.lstatSync("./bots/" + file).isFile());
    let paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
    let rslt: string[] = paths.map((x: path.ParsedPath) => x.name);
    console.log(rslt);
    return rslt;

  }
  return [];
}

export const removeBotFileByName = (name: string) => {
  let path = `./bots/${ name }.json`;
  if (fs.existsSync(path) && confirm(`Are you sure you want to delete ${ name }?`)) {
    fs.unlinkSync(path);
  }
}