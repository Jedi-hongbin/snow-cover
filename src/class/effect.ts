import * as THREE from "three";
import { ThreeHelper } from "../ThreeHelper";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { SnowCover } from "./SnowCover";
import { GUI } from "dat.gui";

export class Effect {
    private composer!: EffectComposer;
    private snowCover: SnowCover;

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

        // 添加雪覆盖后期处理
        this.snowCover = new SnowCover(this.helper.scene, this.helper.camera);
        composer.addPass(this.snowCover);



        composer.addPass(new OutputPass());
    }

    render() {
        this.composer.render();
    }

    addGui(gui: GUI) {
        const folder = gui.addFolder("Snow Cover");
        folder.open();
        
        const uniforms = this.snowCover.uniforms;
        
        folder.add(uniforms.uThreshold, "value", 0, 1).name("Threshold (Coverage)").step(0.01);
        folder.add(uniforms.uOpacity, "value", 0, 1).name("Opacity").step(0.01);
        
        folder.addColor({ color: uniforms.uSnowColor.value.getHex() }, "color")
            .name("Snow Color")
            .onChange((value) => {
                uniforms.uSnowColor.value.setHex(value);
            });
    }
}
