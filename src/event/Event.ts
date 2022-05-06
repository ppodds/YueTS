import { Awaitable, ClientEvents } from "discord.js";
import { Executer } from "../command/Executer";

export interface Event {
    name: keyof ClientEvents;
    once: boolean;
    executer: Executer;
}
