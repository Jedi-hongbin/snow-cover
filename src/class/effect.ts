import * as THREE from "three";
import { ThreeHelper } from "../ThreeHelper";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { GUI } from "dat.gui";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

export class Effect {
    private composer!: EffectComposer;
    params = {
        threshold: 0.17,
        strength: 0.75,
        radius: 0.39,
    };
    private bloomPass!: UnrealBloomPass;

    constructor(private helper: ThreeHelper) {
        // 创建后期渲染
        const composer = new EffectComposer(this.helper.renderer);

        this.composer = composer;

        // 添加fxaa抗锯齿
        const fxaaPass = new ShaderPass(FXAAShader);

        const size = this.helper.renderer.getSize(new THREE.Vector2());

        // 设置fxaaPass分辨率
        fxaaPass.uniforms["resolution"].value.set(1 / size.width, 1 / size.height);

        composer.addPass(new RenderPass(this.helper.scene, this.helper.camera));

        // composer.addPass(fxaaPass);

        // UnrealBloomPass辉光
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = this.params.threshold;
        bloomPass.strength = this.params.strength;
        bloomPass.radius = this.params.radius;
        this.bloomPass = bloomPass;

        composer.addPass(bloomPass);
        composer.addPass(new OutputPass());
    }

    render() {
        this.composer.render();
    }

    addGui(gui: GUI) {
        const folder = gui.addFolder("EffectComposer");
        folder.open();

        folder
            .add(this.params, "threshold", 0, 1)
            .onChange((value) => {
                this.bloomPass.threshold = value;
            })
            .step(0.01).name('阈值');
        folder
            .add(this.params, "strength", 0, 1)
            .onChange((value) => {
                this.bloomPass.strength = value;
            })
            .step(0.01).name('强度');
        folder
            .add(this.params, "radius", 0, 1)
            .onChange((value) => {
                this.bloomPass.radius = value;
            })
            .step(0.01).name('半径');
    }
}
