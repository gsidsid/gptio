const JSON5 = require('json5');

function parseObject(objectString: string) {
  if (!objectString || objectString.indexOf("{") === -1) {
    return {};
  }
  objectString = objectString.substring(
    objectString.indexOf("{"),
    objectString.lastIndexOf("}") + 1
  );
  return JSON5.parse(objectString);
}

function trim(str: string, length: number, maxLineLengthRatio: number = 0.2) {
  let lines = str.split("\n");
  lines = lines.map((line) => {
    return line
      .trim()
      .substring(0, Math.max(length / lines.length, maxLineLengthRatio * length));
  });
  str = lines.join("\n");
  return str.trim().substring(0, length) + (str.length > length ? "..." : "");
}

function prettifyResult(result: any) {
  let res = "";
  try {
    if (typeof result !== "string") {
      res = JSON5.stringify(result, null, 2);
    } else {
      res = result.toString();
    }
  } catch (error) {
    res = result.toString();
  }
  // leave length limiting and formatting to the user
  return res;
}

export {
  parseObject,
  trim,
  prettifyResult
};