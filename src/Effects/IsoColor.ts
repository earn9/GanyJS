import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

const d3Color = require('d3-color');
const d3Interpolate = require('d3-interpolate');
const d3Chromatic = require('d3-scale-chromatic');
const d3Scale = require('d3-scale');

import {
  Effect, Input, InputDimension
} from '../EffectBlock';

import {
  Block
} from '../Block';

import {
  Component
} from '../Data';

import {
  NodeOperation
} from '../NodeMesh';

import {
  IColorMap, getColorMap
} from '../utils/colormaps';


export
class IsoColor extends Effect {

  constructor (parent: Block, input: Input, min: number, max: number, colorMap: IColorMap = getColorMap('Viridis (matplotlib)')) {
    super(parent, input);

    // const width = 256;

    // TODO
    // - Fill array depending on colorsArray and type.
    // - And only expose colormap names to Python? They should be part of a Bunch so that name completion is available
    // - Although the Python API should allow passing custom colormaps as array and type
    // - Allow displaying a colormap from Python

    // const array = new Float32Array(256);
    // const colorsArray = new Uint8ClampedArray(colorMap.colorsArray.map((channel: number) => parseInt(String(255 * channel))));

    console.log(d3Chromatic.schemePiYG);

    const colorArray: string[] = [];
    for (let i = 0; i < colorMap.colorsArray.length / 4; i++) {
      const colorIndex = 4 * i;

      // TODO support control point
      // const x = colorMap.colorsArray[colorIndex];

      const r = Math.round(255 * colorMap.colorsArray[colorIndex + 1]);
      const g = Math.round(255 * colorMap.colorsArray[colorIndex + 2]);
      const b = Math.round(255 * colorMap.colorsArray[colorIndex + 3]);
      const color = d3Color.rgb(r, g, b);

      console.log(r, g, b, color.formatHex());

      colorArray.push(color.formatHex());
    }

    const divergingColorScale = d3Scale.scaleSequential(d3Interpolate.interpolateRgbBasis(colorArray));

    const nColors = 256;
    const colorsArray = new Uint8Array(nColors * 3);
    for (let i = 0; i < nColors; i++) {
      const color = d3Color.color(divergingColorScale(i / (nColors - 1)));

      const colorIndex = 3 * i;

      colorsArray[colorIndex] = color.r;
      colorsArray[colorIndex + 1] = color.g;
      colorsArray[colorIndex + 2] = color.b;
    }

    this.texture = new THREE.DataTexture(colorsArray, nColors, 1, THREE.RGBFormat);

    this.textureNode = new Nodes.TextureNode(this.texture);

    const functionNode = new Nodes.FunctionNode(
      `vec3 isoColorFunc${this.id}(sampler2D textureMap, float min, float max, float data){
        vec2 colorPosition = vec2((data - min) / (max - min), 0.0);

        return vec3(texture2D(textureMap, colorPosition));
      }`
    );

    this.minNode = new Nodes.FloatNode(min);
    this.maxNode = new Nodes.FloatNode(max);

    this.functionCallNode = new Nodes.FunctionCallNode(functionNode, [this.textureNode, this.minNode, this.maxNode, this.inputNode]);

    this.addColorNode(NodeOperation.ASSIGN, this.functionCallNode);

    this.buildMaterial();

    this.initialized = true;
  }

  setInput(input?: Input) : void {
    super.setInput(input);

    if (this.initialized) {
      this.functionCallNode.inputs = [this.textureNode, this.minNode, this.maxNode, this.inputNode];

      this.buildMaterial();
    }
  }

  set min (value: number) {
    this.minNode.value = value;
  }

  get min () {
    return this.minNode.value;
  }

  set max (value: number) {
    this.maxNode.value = value;
  }

  get max () {
    return this.maxNode.value;
  }

  get inputDimension () : InputDimension {
    return 1;
  }

  // set colorMap (colorMap: IColorMap) {
  //   // @ts-ignore
  //   this.textureNode.value = colorMap.texture;
  // }

  private initialized: boolean = false;

  private functionCallNode: Nodes.FunctionCallNode;

  private minNode: Nodes.FloatNode;
  private maxNode: Nodes.FloatNode;

  private texture: THREE.DataTexture;
  private textureNode: Nodes.TextureNode;

  protected inputs: [Component];
  protected inputNode: Nodes.Node;

}
