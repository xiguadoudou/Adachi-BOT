import { filterWordsByRegex, getWordByRegex } from "#utils/tools";
import { getTrueNameByNikeName } from "../nikename/nikename.js";

function getName(text, userID = undefined) {
  let character = filterWordsByRegex(
    text,
    ...[...global.command.functions.entrance.character, ...global.command.functions.entrance.others_character]
  );

  if (character.startsWith("的")) {
    const match = getWordByRegex(character, /的/);
    character = getWordByRegex(match[1] || match[2], /\S+/)[0];
  }

  if (!character) {
    return undefined;
  }

  character = "string" === typeof character ? character.toLowerCase() : "";
  character = getTrueNameByNikeName(userID, character);
  character = global.names.characterAlias[character] || character;

  return character;
}

export { getName };
