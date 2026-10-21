#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>Generate prototype root-only clips and static blockout scenes.
/// Neither creates rigged characters nor asserts WebGL build success.</summary>
public static class CapyniteProductionGenerator
{
    private const string Root = "Assets/CapyniteGenerated";
    private static readonly string[] Characters = {
        "capivini","capininja","capirocket","capizozo","drako","panther",
        "chief","maga","pirate","dragon","emperor","reserved_12"
    };
    private static readonly string[] Actions = {
        "idle","enter_arena","basic_attack","heavy_attack","special_ability","defend",
        "hit_reaction","heal","evolve","victory","defeat","taunt"
    };
    private static readonly float[] Duration = {3f,2f,.7f,1.2f,2f,.6f,.4f,1f,2f,2f,1.5f,2f};
    private static readonly string[] Biomes = {
        "underground","alien_chamber","capycity_rivers","lava_caves","royal_palace"
    };

    [MenuItem("Capynite Production/Generate placeholder animation clips")]
    public static void GenerateClips()
    {
        int count = 0;
        foreach (string character in Characters)
        {
            var dir = Root + "/Animations/" + character;
            Directory.CreateDirectory(dir);
            var controller = AnimatorController.CreateAnimatorControllerAtPath(dir + "/Animator.controller");
            for (int k = 0; k < Actions.Length; k++)
            {
                var clip = new AnimationClip { frameRate = 30f, name = character + "_" + Actions[k] };
                var curve = new AnimationCurve();
                int frames = Mathf.CeilToInt(Duration[k] * 30f);
                for (int j = 0; j <= frames; j++)
                {
                    float time = Duration[k] * j / frames;
                    curve.AddKey(time, .08f * Mathf.Sin(time / Duration[k] * Mathf.PI * 2f));
                }
                AnimationUtility.SetEditorCurve(
                    clip, EditorCurveBinding.FloatCurve("", typeof(Transform), "m_LocalPosition.y"), curve);
                AssetDatabase.CreateAsset(clip, dir + "/" + Actions[k] + ".anim");
                var state = controller.layers[0].stateMachine.AddState(Actions[k]);
                state.motion = clip;
                if (k == 0) controller.layers[0].stateMachine.defaultState = state;
                count++;
            }
        }
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        Debug.Log("Generated " + count + " draft root-motion clips — NOT rig animations.");
    }

    [MenuItem("Capynite Production/Generate five arena blockouts")]
    public static void GenerateScenes()
    {
        Directory.CreateDirectory(Root + "/Scenes");
        for (int i = 0; i < Biomes.Length; i++)
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var floor = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            floor.name = "Prototype Arena Platform";
            floor.transform.localScale = new Vector3(12f, .2f, 12f);
            floor.transform.position = new Vector3(0, -.2f, 0);
            for (int p = 0; p < 12; p++)
            {
                float a = p * Mathf.PI * 2f / 12f;
                var prop = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                prop.name = "Arena Decor " + p;
                prop.transform.position = new Vector3(10f * Mathf.Cos(a), 1f, 10f * Mathf.Sin(a));
                prop.transform.localScale = new Vector3(.4f, 1f, .4f);
            }
            var sun = new GameObject("Sun").AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.transform.rotation = Quaternion.Euler(55f, -30f, 0f);
            var cam = new GameObject("Main Camera");
            cam.tag = "MainCamera";
            var camera = cam.AddComponent<Camera>();
            cam.AddComponent<AudioListener>();
            camera.transform.position = new Vector3(0, 12, -16);
            camera.transform.LookAt(Vector3.zero);
            EditorSceneManager.SaveScene(scene, Root + "/Scenes/" + Biomes[i] + ".unity");
        }
        AssetDatabase.Refresh();
        Debug.Log("Generated five static scene BLOCKOUTS — gameplay not connected.");
    }
}
