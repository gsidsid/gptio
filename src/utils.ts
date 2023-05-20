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
  try {
    if (typeof result === "object") {
      return trim(JSON5.stringify(result, null, 2), 1000);
    } else {
      return trim(result.toString(), 1000);
    }
  } catch (error) {
    return trim(result.toString(), 1000);
  }
}

export {
  parseObject,
  trim,
  prettifyResult
};