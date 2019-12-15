import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

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


export
enum ColorMapType {
    DIVERGING,
    LAB,
    RGB,
    STEP,
    CIELAB,
    HSV,
}


export
class ColorMap {

  constructor (colorsArray: Float32Array, type: ColorMapType) {
    this.colorsArray = colorsArray;
    this.type = type;

    const width = 256;

    let array: Float32Array;

    // Fill array depending on colorsArray and type.
    // Maybe the JSON file should be available in GanyJS?
    // And only expose colormap names to Python? They should be part of a Bunch so that name completion is available
    // Although the Python API should allow passing custom colormaps as array and type

    this.texture = new THREE.DataTexture(array, width, 1, THREE.RGBFormat, THREE.UnsignedByteType);
  }

  readonly colorsArray: Float32Array;
  readonly type: ColorMapType;
  readonly texture: THREE.DataTexture;

}


export
class IsoColor extends Effect {

  constructor (parent: Block, input: Input, min: number, max: number, colorMap: ColorMap) {
    super(parent, input);

    this.textureNode = new Nodes.TextureNode(colorMap.texture);

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

  set colorMap (colorMap: ColorMap) {
    // @ts-ignore
    this.textureNode.value = colorMap.texture;
  }

  private initialized: boolean = false;

  private functionCallNode: Nodes.FunctionCallNode;

  private minNode: Nodes.FloatNode;
  private maxNode: Nodes.FloatNode;

  private textureNode: Nodes.TextureNode;

  protected inputs: [Component];
  protected inputNode: Nodes.Node;

}
