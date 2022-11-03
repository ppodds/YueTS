import { exit } from "node:process";
import { CommandDeployer } from "./command/CommandDeployer";

process.chdir("dist");
const commandDeployer = new CommandDeployer();
commandDeployer
    .run()
    .then(() => exit(0))
    .catch((err) => {
        console.log(err);
        exit(1);
    });
