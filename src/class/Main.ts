import * as THREE from "three";
import { ThreeHelper } from "@/src/ThreeHelper";
import { MethodBaseSceneSet, LoadGLTF } from "@/src/ThreeHelper/decorators";
import { MainScreen } from "@/src/components/Three/Canvas";
import { Injectable } from "@/src/ThreeHelper/decorators/DI";
import type { GUI } from "dat.gui";
import { Scene } from "@/src/class/Scene";
import { Effect } from "@/src/class/effect";

@Injectable
export class Main extends MainScreen {
    static instance: Main;
    _scene!: Scene;
    _effect!: Effect;

    constructor(private helper: ThreeHelper) {
        super(helper);
        helper.main = this;
        Main.instance = this;

        this.init();
    }

    @MethodBaseSceneSet({
        addAxis: false,
        cameraPosition: new THREE.Vector3(0, 20, 25),
        cameraTarget: new THREE.Vector3(0, 0, 0),
        useRoomLight: false,
        near: 0.3,
        far: 500,
    })
    async init() {
        this.helper.renderer.setPixelRatio(2);

        this._scene = new Scene(this.helper);
        // 创建后期渲染
        this._effect = new Effect(this.helper);

        const CubeTexture = await this.helper.setBackgroundHDR("/public/env/Standard-Cube-Map2/");

        this.helper.scene.environment = CubeTexture;

        this.helper.add(this._scene.scene);

        this.helper.render = () => {
            this._effect.render();
        };
    }

    @ThreeHelper.InjectAnimation(Main)
    animation() {}

    @ThreeHelper.AddGUI(Main)
    Gui(gui: GUI) {
        if (gui) {
            this._effect?.addGui(gui);
            this._scene?.addGUI(gui);
        }
    }
}
