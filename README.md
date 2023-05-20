# GPTIO
A simple typescript alternative to langchain in a few hundred LOC.

---

Langchain seemed a bit overkill to me so here’s my opinionated substitute for it. Some real issues for new users include:

- [Huge # of terms to understand just to get started: chains, agents, tools, prompt templates, parsers, etc.](https://js.langchain.com/docs/). [Many seemingly pointless wrapper classes and concepts.](https://www.reddit.com/r/LangChain/comments/13fcw36/langchain_is_pointless/)
- Poorly adapted to chat models and dramatically increased context sizes that reduce the need for complex memory schemes (sliding window, summarization, etc).
- Barely any support for providing multiple inputs to functions in TS/JS. No documentation for the StructuredTool class for this essential functionality outside [a fairly minimal Jupyter notebook](https://github.com/hwchase17/langchain/blob/master/docs/modules/agents/tools/multi_input_tool.ipynb).
- Large influx of new, easy to use vector db providers mean long term memory can likely easily be implemented by users via custom tools. [Chroma](https://github.com/chroma-core/chroma), [Lance](https://github.com/lancedb/lancedb), etc.

---

Start by installing

```bash
npm i gptio
```

Everything you need to get started:

```ts
import GPTIO from "./gptio";

// Inputs to "actions" are passed through a single input object
function add({a, b}: {a: number, b: number}) {
  return a + b;
}

function multiply({a, b}: {a: number, b: number}) {
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
    beforeAction: (action: GptioAction, input: string) => {
      // Add custom logic that should be run before each action
      // throw an error to interrupt and end the run
    },
    afterAction: (action: GptioAction, input: string, result: any) => {
      // ...run after each action is executed
    },
    afterThought: (thought: GptioResponse) => {
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

If it’s missing a feature, do contribute to this repo, or just copy the source code– there isn’t a lot.