import * as THREE from "three";
import { ThreeHelper } from "../ThreeHelper";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { GUI } from "dat.gui";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { Scene } from "./Scene";

export class Effect {
    private composer!: EffectComposer;
    params = {
        threshold: 0.1,
        strength: 0.75,
        radius: 0.39,
    };
    outlineParams = {
        edgeStrength: 2.0,
        edgeGlow: 0.0,
        edgeThickness: .5,
        pulsePeriod: 0,
        visibleEdgeColor: "#ffffff",
        hiddenEdgeColor: "#000000",
    };
    private bloomPass!: UnrealBloomPass;
    private outlinePass!: OutlinePass;
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();

    constructor(
        private helper: ThreeHelper,
        private scene: Scene,
    ) {
        // 创建后期渲染
        const composer = new EffectComposer(this.helper.renderer);

        this.composer = composer;

        // 添加fxaa抗锯齿
        const fxaaPass = new ShaderPass(FXAAShader);

        const size = this.helper.renderer.getSize(new THREE.Vector2());

        // 设置fxaaPass分辨率
        fxaaPass.uniforms["resolution"].value.set(1 / size.width, 1 / size.height);

        composer.addPass(new RenderPass(this.helper.scene, this.helper.camera));


        // OutlinePass
        const outlinePass = new OutlinePass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.helper.scene,
            this.helper.camera,
        );
        outlinePass.edgeStrength = this.outlineParams.edgeStrength;
        outlinePass.edgeGlow = this.outlineParams.edgeGlow;
        outlinePass.edgeThickness = this.outlineParams.edgeThickness;
        outlinePass.pulsePeriod = this.outlineParams.pulsePeriod;
        outlinePass.visibleEdgeColor.set(this.outlineParams.visibleEdgeColor);
        outlinePass.hiddenEdgeColor.set(this.outlineParams.hiddenEdgeColor);
        this.outlinePass = outlinePass;
        // composer.addPass(outlinePass);

        outlinePass.selectedObjects = this.scene.selectedObjects;

        // UnrealBloomPass辉光
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = this.params.threshold;
        bloomPass.strength = this.params.strength;
        bloomPass.radius = this.params.radius;
        this.bloomPass = bloomPass;

        composer.addPass(bloomPass);

        composer.addPass(fxaaPass);

        composer.addPass(new OutputPass());

        this.initMouseSelect();
    }

    initMouseSelect() {
        // this.helper.renderer.domElement.style.touchAction = 'none';
        // this.helper.renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    }

    onPointerMove(event: PointerEvent) {
        if (event.isPrimary === false) return;

        // const rect = this.helper.renderer.domElement.getBoundingClientRect();
        // this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        // this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // this.raycaster.setFromCamera(this.mouse, this.helper.camera);

        // const intersects = this.raycaster.intersectObjects(this.helper.scene.children, true);

        // if (intersects.length > 0) {
        //     const object = intersects[0].object;
        //     this.outlinePass.selectedObjects = [object];
        // } else {
        //     this.outlinePass.selectedObjects = [];
        // }
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
            .step(0.01)
            .name("阈值");
        folder
            .add(this.params, "strength", 0, 1)
            .onChange((value) => {
                this.bloomPass.strength = value;
            })
            .step(0.01)
            .name("强度");
        folder
            .add(this.params, "radius", 0, 1)
            .onChange((value) => {
                this.bloomPass.radius = value;
            })
            .step(0.01)
            .name("半径");

        const outlineFolder = gui.addFolder("OutlinePass");
        outlineFolder.open();
        outlineFolder
            .add(this.outlineParams, "edgeStrength", 0.01, 10)
            .onChange((value) => {
                this.outlinePass.edgeStrength = value;
            })
            .name("边缘强度");
        outlineFolder
            .add(this.outlineParams, "edgeGlow", 0.0, 1)
            .onChange((value) => {
                this.outlinePass.edgeGlow = value;
            })
            .name("边缘发光");
        outlineFolder
            .add(this.outlineParams, "edgeThickness", 1, 4)
            .onChange((value) => {
                this.outlinePass.edgeThickness = value;
            })
            .name("边缘厚度");
        outlineFolder
            .add(this.outlineParams, "pulsePeriod", 0.0, 5)
            .onChange((value) => {
                this.outlinePass.pulsePeriod = value;
            })
            .name("闪烁周期");
        outlineFolder
            .addColor(this.outlineParams, "visibleEdgeColor")
            .onChange((value) => {
                this.outlinePass.visibleEdgeColor.set(value);
            })
            .name("可见边缘颜色");
        outlineFolder
            .addColor(this.outlineParams, "hiddenEdgeColor")
            .onChange((value) => {
                this.outlinePass.hiddenEdgeColor.set(value);
            })
            .name("遮挡边缘颜色");
    }
}
