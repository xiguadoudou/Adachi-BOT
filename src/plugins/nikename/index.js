import db from "../../utils/database.js";

async function Plugin(Message) {
  let msg = Message.raw_message;
  let userID = Message.user_id;
  let groupID = Message.group_id;
  let type = Message.type;
  let name = Message.sender.nickname;
  let sendID = type === "group" ? groupID : userID;
  if (msg.includes("初始化昵称")) {
    await db.set("nikename", userID, []);
    return;
  }
  let array = msg.split(" ");
  if (array.length < 3) return;
  let character = array[1];
  let nikename = array[2];
  if (!character || !nikename) {
    await bot.sendMessage(sendID, `[CQ:at,qq=${userID}] 请正确输入角色名称。`, type);
    return;
  }
  if (!(await db.containKey("nikename", userID))) {
    let initData = [
      {
        nikename: nikename,
        character: character,
      },
    ];
    await db.set("nikename", userID, initData);
  } else if (!(await db.includes("nikename", userID, "nikename", nikename))) {
    let initData = {
      nikename: nikename,
      character: character,
    };
    await db.push("nikename", userID, initData);
  } else {
    await db.update("nikename", userID, { nikename }, { character });
  }
  //await bot.sendMessage(sendID, message, type);
}

export { Plugin as run };
