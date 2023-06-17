import { GuildMember, AttachmentBuilder } from "discord.js";
import pkg from "canvas";
import { ArgsOf, Discord, On } from "discordx";
const { registerFont, createCanvas, loadImage } = pkg;

function clipRoundedRect(canvas: pkg.Canvas, radius: number) {
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, radius);
    ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, radius);
    ctx.arcTo(0, canvas.height, 0, 0, radius);
    ctx.arcTo(0, 0, canvas.width, 0, radius);
    ctx.clip();
}

function clipCircle(canvas: pkg.Canvas) {
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        2 * Math.PI
    );
    ctx.clip();
}

function createMask(width: number, height: number): pkg.Canvas {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    clipRoundedRect(canvas, 10);
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);
    return canvas;
}

async function createAvatar(member: GuildMember): Promise<pkg.Canvas> {
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext("2d");
    clipCircle(canvas);
    const avatar = await loadImage(
        member.displayAvatarURL({ extension: "png", size: 256 })
    );
    ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgb(90,207,245)";
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(
        avatar.width / 2,
        avatar.height / 2,
        avatar.width / 2,
        0,
        2 * Math.PI
    );
    ctx.stroke();
    return canvas;
}

function fillText(canvas: pkg.Canvas, member: GuildMember): pkg.Canvas {
    const ctx = canvas.getContext("2d");
    ctx.font = "30pt 'Microsoft JhengHei'";
    ctx.fillStyle = "rgb(90,207,245)";
    ctx.textAlign = "center";
    ctx.fillText(
        `歡迎 ${member.user.tag} 的加入！`,
        canvas.width / 2,
        canvas.height * 0.75
    );
    ctx.font = "lighter 26pt 'Microsoft JhengHei'";
    ctx.fillText(
        `第 ${member.guild.memberCount} 位成員！`,
        canvas.width / 2,
        canvas.height * 0.75 + 50
    );
    return canvas;
}

@Discord()
export class WelcomeEvent {
    @On({ event: "guildMemberAdd" })
    async execute([member]: ArgsOf<"guildMemberAdd">) {
        const bg = await loadImage("assets/images/welcome.jpg");
        registerFont("assets/fonts/msjh.ttc", {
            family: "Microsoft JhengHei",
            weight: "normal",
        });
        registerFont("assets/fonts/msjhl.ttc", {
            family: "Microsoft JhengHei",
            weight: "lighter",
        });
        const canvas = createCanvas(bg.width, bg.height);
        const ctx = canvas.getContext("2d");
        clipRoundedRect(canvas, 10);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        const mask = createMask(canvas.width * 0.9, canvas.height * 0.9);
        ctx.drawImage(
            mask,
            canvas.width * 0.1 * 0.5,
            canvas.height * 0.1 * 0.5
        );
        const avatar = await createAvatar(member);
        ctx.drawImage(
            avatar,
            (canvas.width - avatar.width) / 2,
            (canvas.height - avatar.height) / 2 - 60
        );
        fillText(canvas, member);
        if (member.guild.systemChannel)
            await member.guild.systemChannel.send({
                files: [
                    new AttachmentBuilder(canvas.toBuffer(), {
                        name: "card.png",
                    }),
                ],
            });
    }
}
