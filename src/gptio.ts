import * as dotenv from "dotenv";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { GptioAction, GptioCallbacks, GptioOptions } from "./types";
import { parseObject, prettifyResult } from "./utils";
import generateSystemPrompt from "./prompt";
import { requiresm } from "esm-ts";

const safeEval = require("safe-eval");
const JSON5 = require("json5");

// Load environment variables from a .env file
dotenv.config();

class GPTIO {
  model: string;
  actions: GptioAction[];
  callbacks: GptioCallbacks;
  messages: ChatCompletionRequestMessage[];
  options: GptioOptions = {};
  openai: OpenAIApi;
  result: any;
  spinner: any;

  /**
   * @param model - The name of the model to use ("gpt-3.5-turbo" or "gpt-4").
   * @param actions - An array of action objects, where each object includes a function name, the function itself, and an array of input objects.
   * @param callbacks - An object of optional callback functions to run before and after each action and thought.
   * @param options - Additional optional settings.
   */
  constructor(
    model: string,
    actions: GptioAction[],
    callbacks: GptioCallbacks,
    options: GptioOptions = {}
  ) {
    // Configure OpenAI API using environment variables
    if (!process.env.OPENAI_API_KEY && !options.key) {
      throw new Error(
        "No OpenAI API key provided. Please provide an API key as an environment variable or in the options object as 'key'."
      );
    }
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY || options.key,
    });
    this.openai = new OpenAIApi(configuration);
    this.model = model;
    this.actions = actions;
    this.options = options;
    // If evaluation option is true, add the "evaluate" action to the action list
    if (options.evaluation) {
      this.actions.push({
        name: "evaluate",
        description:
          "Evaluates a JavaScript expression and returns the result. Variables using let, const, var, etcetera are not supported. Functions are not supported, but you can use the self-executing function syntax ( ... )() to run a function.",
        func: ({ code }: { code: string }) => safeEval(code),
        inputs: [
          {
            name: "code",
            type: "string",
            description: `Any valid javascript expression. Expressions are evaluated using the safe-eval package.`,
          },
        ],
      });
    }
    this.callbacks = callbacks;
    this.messages = [
      {
        role: "system",
        content: generateSystemPrompt(actions),
      },
    ];
    this.result = null;
    this.spinner = null;
  }

  // Internal method to add a message to the message list and handle its display
  private _pushMessage(message: ChatCompletionRequestMessage) {
    this.messages.push(message);
    try {
      let content = JSON5.parse(message.content);
      if (content.type === "observation") {
        if (content.done) {
          if (content.error) {
            this.spinner.fail(content.message);
          } else {
            this.spinner.succeed(content.message);
          }
          if (this.options.debug) {
            console.log(`
Debug info:

AVAILABLE ACTIONS ---------------------\n
${this.actions.map((action) => action.name)}

CONVERSATION HISTORY ------------------\n
${this.messages
  .slice(1)
  .map((message) => {
    try {
      return JSON5.stringify(JSON5.parse(message.content), null, 2);
    } catch (error) {
      return `[Unparsable JSON] ${message.content}`;
    }
  })
  .join("\n\n")}
`);
          }
        }
        this.spinner.prefixText = "[Thought]";
        this.spinner.text = content.thought;
        this.spinner.color = "green";
      } else if (content.type === "action") {
        this.spinner.prefixText = "[Action]";
        this.spinner.text = content.action;
        this.spinner.color = "yellow";
      } else if (content.type === "result") {
        // Result is returned after a 1 second delay to allow the user to read the action
        setTimeout(() => {
          this.spinner.prefixText = "[Result]";
          this.spinner.text = content.data.replaceAll("\n", " ");
          this.spinner.color = "blue";
        }, 1000);
      }
    } catch (error) {
    }
  }

  // Internal method to execute an action
  private _executeAction(
    action: GptioAction,
    inputObject: string
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.callbacks.beforeAction) {
          await this.callbacks.beforeAction(action, inputObject);
        }
        let result = null;
        try {
          result = await action.func(inputObject);
          this.result = result;
          this._pushMessage({
            role: "user",
            content: JSON5.stringify(
              {
                type: "result",
                data: `Executed action ${action.name}. Result: ${prettifyResult(
                  result
                )}`,
              },
              null,
              2
            ),
          });
        } catch (error: any) {
          this._pushMessage({
            role: "user",
            content: JSON5.stringify(
              {
                type: "result",
                data: `Error executing action ${action.name}: ${error.message}`,
              },
              null,
              2
            ),
          });
        }
        if (this.callbacks.afterAction) {
          await this.callbacks.afterAction(action, inputObject, result);
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @param message - A prompt containing the task to executed using the provided actions.
   * @returns A Promise that resolves to the model's response.
   */
  run(message: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let timeoutExceeded = false;
        if (this.options.timeout) {
          setTimeout(() => {
            timeoutExceeded = true;
          }, this.options.timeout * 1000);
        }
        this.spinner = await requiresm("ora");
        this.spinner = this.spinner.default;
        this.spinner = this.spinner("Initializing").start();
        this.result = null;
        let completion: any = {
          type: "observation",
          thought: `The user says: "${message}". I need to determine the best first action to take for the user.`,
          done: false,
        };
        this._pushMessage({
          role: "assistant",
          content: JSON5.stringify(completion, null, 2),
        });
        while (!completion.done && !timeoutExceeded) {
          completion = await this.openai.createChatCompletion({
            model: this.model,
            messages: this.messages,
            temperature: 0.2,
          });
          if (timeoutExceeded) {
            this.spinner.fail(`Timeout exceeded (${this.options.timeout} seconds)`);
            reject(`Timeout exceeded (${this.options.timeout} seconds)`);
          }
          if (!completion.data.choices[0].message?.content) {
            this.spinner.fail(
              `OpenAI returned an empty response.`
            );
            reject(`OpenAI returned an empty response.`);
          }
          try {
            this._pushMessage({
              role: "assistant",
              content: completion.data.choices[0].message?.content,
            });
            completion = parseObject(
              completion.data.choices[0].message?.content
            );
          } catch (error: any) {
            this._pushMessage({
              role: "user",
              content: JSON5.stringify(
                {
                  type: "result",
                  data: `Error while reading submitted action: ${error.toString()}`,
                },
                null,
                2
              ),
            });
            continue;
          }
          if (completion.type === "action") {
            const action = this.actions.find(
              (action) => action.name === completion.action
            );
            if (!action) {
              this._pushMessage({
                role: "user",
                content: JSON5.stringify(
                  {
                    type: "result",
                    data: `Error: Action named '${
                      completion.action
                    }' was not found in list of available actions: ${this.actions
                      .map((action) => action.name)
                      .toString()}`,
                  },
                  null,
                  2
                ),
              });
              continue;
            }
            await this._executeAction(action, completion.input);
          } else if (completion.type === "observation") {
            if (this.callbacks.afterThought) {
              await this.callbacks.afterThought(completion.thought);
            }
            if (completion.done) {
              if (completion.error) {
                resolve({
                  error: completion.error,
                  message: completion.message,
                });
              } else {
                resolve({
                  result: this.result,
                  message: completion.message,
                });
              }
            }
          } else {
            this._pushMessage({
              role: "assistant",
              content: JSON5.stringify(
                {
                  type: "result",
                  thought: `Error: did not understand the type '${completion.type}', which must be 'action', or 'observation'.`,
                },
                null,
                2
              ),
            });
          }
        }
      } catch (error: any) {
        if (this.options.debug) {
          console.error(error);
        }
        this.spinner.fail(`Error: ${error.message | error.toString()}`);
        reject(`Error: ${error.message | error.toString()}`);
      }
    });
  }
}

export default GPTIO;
