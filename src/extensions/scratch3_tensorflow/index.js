const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

const tf = require('@tensorflow/tfjs');
const math = require('mathjs');

class Scratch3TensorflowBlocks {

    static get EXTESNION_NAME () {
        return 'Tensorflow';
    }

    static get EXTENSION_ID () {
        return 'tensorflow';
    }

    constructor (runtime) {
        this.runtime = runtime;

        /**
         * X값에 대한 초기 배열 설정
         * @type {Array}
         * @private
         */
        this.x = [];

        /**
         * Y값에 대한 초기 배열 설정
         * @type {Array}
         * @private
         */
        this.y = [];

        /**
         * W 대한 초기 값 설정
         * @type {Array}
         * @private
         */
        this.w = [];

        /**
         * Bias에 대한 초기 값 설정
         * @type {Number}
         * @private
         */
        this.b = 0;

        this.cost = 1;
        this.optimizer = 1;
    }

    getInfo () {
        return {
            id: Scratch3TensorflowBlocks.EXTENSION_ID,
            name: Scratch3TensorflowBlocks.EXTESNION_NAME,
            //blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'defLinear',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'tensorflow.defLinear',
                        default: 'def linear function train data x [TRAIN_DATA_X] train data y [TRAIN_DATA_Y] weights [W_ARRAY] bias [BIAS]',
                        description: 'def Linear with input dim, weights, bias'
                    }),
                    arguments: {
                        TRAIN_DATA_X: {
                            type: ArgumentType.STRING,
                            defaultValue: '1',
                        },
                        TRAIN_DATA_Y: {
                          type: ArgumentType.STRING,
                          defaultValue: '1',
                        },
                        W_ARRAY: {
                            type: ArgumentType.STRING,
                            defaultValue: '1',
                        },
                        BIAS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'setCost',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'tensorflow.setCost',
                        default: 'set cost function [COST]',
                        description: 'set cost function'
                    }),
                    arguments: {
                        COST: {
                            type: ArgumentType.NUMBER,
                            menu: 'COST',
                            defaultValue: 1
                        },
                    }
                },
                {
                    opcode: 'setOptimizer',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'tensorflow.setOptimizer',
                        default: 'set optimizer function [OPTIMIZER]',
                        description: 'set optimizer function'
                    }),
                    arguments: {
                        OPTIMIZER: {
                            type: ArgumentType.NUMBER,
                            menu: 'OPTIMIZER',
                            defaultValue: 1
                        },
                    }
                },
                {
                    opcode: 'train',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'tensorflow.train',
                        default: 'train with learning rates [LEARNING_RATES] epoch [EPOCH]',
                        description: 'train with learning rates, epoch'
                    }),
                    arguments: {
                        LEARNING_RATES: {
                          type: ArgumentType.NUMBER,
                          defaultValue: 1,
                        },
                        EPOCH: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                        }
                    }
                },
            ],
            menus: {
                COST: {
                    acceptReporters: true,
                    items: this._buildMenu(this.COST_INFO)
                },
                OPTIMIZER: {
                  acceptReporters: true,
                  items: this._buildMenu(this.OPTIMIZER_INFO)
              },
            }
        };
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array of objects with text and
     * value properties. The text is a translated string, and the value is one-indexed.
     * @param  {object[]} info - An array of info objects each having a name property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
      return info.map((entry, index) => {
          const obj = {};
          obj.text = entry.name;
          obj.value = String(index + 1);
          return obj;
      });
    }

    /**
     * An array of info about each cost function.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the cost function menu.
     */
    get COST_INFO () {
      return [
          {
              name: formatMessage({
                  id: 'tensorflow.cost.mse',
                  default: '(1) Mean Sqaure Error',
                  description: 'Using mean square error cost function'
              })
          },
      ];
    }

    /**
     * An array of info about each optimizer function.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the optimizer function menu.
     */
    get OPTIMIZER_INFO () {
      return [
          {
              name: formatMessage({
                  id: 'tensorflow.optimizer.gd',
                  default: '(1) Gradient Descent',
                  description: 'Using gradient descent optimizer function'
              })
          },
      ];
    }

    defLinear(args, util) {
        this._defLinear(args.TRAIN_DATA_X, args.TRAIN_DATA_Y, args.W_ARRAY, args.BIAS, util);
    }

    setCost(args, util) {
        this._setCost(args.COST, util);
    }

    setOptimizer(args, util) {
        this._setOptimizer(args.OPTIMIZER, util);
    }

    train(args, util) {
        this._train(args.LEARNING_RATES, args.EPOCH, util);
    }

    _defLinear(train_data_x, train_data_y, w_list, bias, util) {
        this.x = (train_data_x.search(' ') == -1) ? train_data_x.split('').map((v) => [Number(v)]) : train_data_x.split(' ').map((v) => v.split(',').map(w => Number(w)));
        this.y = (train_data_y.search(' ') == -1) ? train_data_y.split('').map((v) => [Number(v)]) : train_data_y.split(' ').map((v) => v.split(',').map(w => Number(w)));
        this.w = w_list.split('').map(v => Number(v));
        this.b = Number(bias);

        console.log(this.x, this. y, this.w, this.b);
    }

    _setCost(cost, util) {
        this.cost = cost;
    }

    _setOptimizer(optimizer, util) {
        this.optimizer = optimizer;
    }

    _train(learning_rates, epoch, util) {

      /**
       * cost function: MSE
       * optimizer function: Gradient Descent
       */
      if (this.cost == 1 && this.optimizer == 1) {
        let prev = this.w;

        for (let i = 0; i < epoch; i++) {
          this.w = this.w.map((weight, i) => Number(weight - learning_rates * (1. / this.y.length) * this.x.map((v, j) => ((math.multiply(math.matrix(v), this.w) + this.b) - this.y[j]) * v[i]).reduce((prev, curr) => prev + curr)));
        }

        console.log('weights: ' + this.w[0] + '\npredict: ' + this.x.map(v => (math.multiply(math.matrix(v), this.w) + this.b)));
      }
    }
}

module.exports = Scratch3TensorflowBlocks;