# GPTIO
A simple typescript alternative to langchain custom tools in a few hundred LOC.

![Demo Gif](examples/demo.gif)

---

Start by installing:

```bash
npm i gptio
```

Set an environment variable:

```bash
OPENAI_API_KEY=sk-***************************
```

Everything you need to get started:

```js
import GPTIO from "gptio";

// Inputs to "actions" are passed through a single input object
function add({a, b}) {
  return a + b;
}

function multiply({a, b}) {
  return a * b;
}

const gptio = new GPTIO(
  // OpenAI chat model (gpt-3.5-turbo or gpt-4)
  "gpt-4",
  // Actions to give GPTIO (your functions + descriptions)
  [
    {
      name: "add",
      description: "Adds two numbers together.",
      func: add,
      inputs: [
        {
          name: "a",
          type: "number", // Any valid JSON type
          description: "The first number to add.",
        },
        {
          name: "b",
          type: "number",
          description: "The second number to add.",
        },
      ],
    },
    {
      name: "multiply",
      description: "Multiplies two numbers together.",
      func: multiply,
      inputs: [
        {
          name: "a",
          type: "number",
          description: "The first number to multiply.",
        },
        {
          name: "b",
          type: "number",
          description: "The second number to multiply.",
        },
      ],
    }
  ],
  // Optional custom callbacks for progress reporting or early exits
  {
    beforeAction: (action, input) => {
      // Add custom logic that should be run before each action
      // throw an error to interrupt and end the run
    },
    afterAction: (action, input, result) => {
      // ...run after each action is executed
    },
    afterThought: (thought) => {
      // ...run after each thought is generated
    }
  },
  // GPTIO options
  {
    // enable a built-in JS code execution action using safe-eval
    evaluation: true,
    // print the entire conversation at the end if there's an error
    debug: true,
    // timeout in seconds for the entire run
    timeout: 100
  }
);

gptio.run("Get me the current time and identify if the number of minutes is a prime number.").then((result) => {
  console.log(result);
}).catch((error) => {
  console.log(error);
});
```

GPTIO will reason through and execute actions in a sequence to solve whatever task you give it in `run()`, and will attempt to inform you if the actions you've provided are insufficient.

If it’s missing a feature, do contribute to this repo, or just copy the source code– there isn’t a lot.
