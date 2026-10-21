using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class CapyniteBuild
{
    const string ScenePath = "Assets/Scenes/CapyniteBossArena.unity";

    [MenuItem("Capynite/Create Playable Boss Arena")]
    public static void GenerateScene()
    {
        Directory.CreateDirectory("Assets/Scenes");
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        var root = new GameObject("Capynite Boss Arena");
        root.AddComponent<CapyniteBossArena>();
        EditorSceneManager.SaveScene(scene, ScenePath);
        EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        AssetDatabase.Refresh();
        Debug.Log("Playable scene created: " + ScenePath);
    }

    [MenuItem("Capynite/Build WebGL Boss Arena")]
    public static void BuildWebGL()
    {
        GenerateScene();
        Directory.CreateDirectory("Builds/WebGL");
        var options = new BuildPlayerOptions
        {
            scenes = new[] { ScenePath },
            locationPathName = "Builds/WebGL",
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };
        BuildReport report = BuildPipeline.BuildPlayer(options);
        Debug.Log("Capynite WebGL build: " + report.summary.result + " size=" + report.summary.totalSize);
        if (report.summary.result != BuildResult.Succeeded)
            throw new Exception("Capynite WebGL build failed: " + report.summary.result);
    }
}
