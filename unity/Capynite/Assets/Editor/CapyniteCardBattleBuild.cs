using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class CapyniteCardBattleBuild
{
    private const string ScenePath = "Assets/Scenes/CapyniteCardBattle.unity";
    [MenuItem("Capynite/Create Card Battle Target Scene")]
    public static void CreateScene()
    {
        Directory.CreateDirectory("Assets/Scenes");
        var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
        new GameObject("Card Battle Target Prototype").AddComponent<CapyniteCardBattleTarget>();
        EditorSceneManager.SaveScene(scene,ScenePath);
        AssetDatabase.Refresh();
    }
    [MenuItem("Capynite/Build Card Battle WebGL")]
    public static void Build()
    {
        CreateScene();
        var path="Builds/CardBattleWebGL";
        Directory.CreateDirectory(path);
        var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions {
            scenes=new[]{ScenePath},locationPathName=path,target=BuildTarget.WebGL,options=BuildOptions.None
        });
        if(report.summary.result!=BuildResult.Succeeded)
            throw new Exception("Card Battle WebGL build failed: "+report.summary.result);
        Debug.Log("Card Battle WebGL generated: "+path);
    }
}
