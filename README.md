# GPTIO

**UPDATE: Many of the features this library provides have since been implemented nearly 1:1 into OpenAI's own API as Function Calling.**

A simple typescript alternative to langchain custom tools in a few hundred LOC to buck all the pointless prompt psuedoscience.

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
  // Optional custom callbacks for progress reporting, custom memory schemes, or early exits
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
    // in smooth brain terms: GPTIO can self-author custom tools
    evaluation: true,
    // print the entire chain of thought at the end
    debug: true,
    // timeout in seconds for the entire run
    timeout: 100
  }
);

gptio.run("Get me the current time and identify if the number of minutes is a prime number.").then((result) => {
  // results look like { result: any, message: string }
  // errors look like { error: true, message: string }
  console.log(result);
}).catch((error) => {
  // execution error (timeout, error thrown from callback, Open AI, etc.)
  console.log(error);
});
```

GPTIO will reason through and execute actions in a sequence to solve whatever task you give it in `run()`, and will attempt to inform you if the actions you've provided are insufficient.

---

### Memory

Memory can be easily integrated with GPTIO in 2 easy steps /s

1. Write a function `remember` (name it whatever you want) that accepts a query string as input, reads your memory provider (vector db, in memory store, idc), and returns a formatted string with the information you'd like to recall. Add it as an action into your GPTIO config.
2. In the `afterAction`, save the result in your memory, better yet, tag it with `action.name`.

Or, feel free to deal with [this](https://python.langchain.com/en/latest/reference/modules/memory.html).

---


If it’s missing a feature, do contribute to this repo, or just copy the source code– there isn’t a lot.
