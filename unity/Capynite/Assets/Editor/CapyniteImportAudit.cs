using System;
using System.Linq;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Strict editor audit for prototype skeletal GLBs imported through a glTF
/// editor importer (for example Unity glTFast). This does not approve artwork.
/// </summary>
public static class CapyniteImportAudit
{
    private static readonly string[] Models = { "drako_skeletal_demo", "panther_skeletal_demo" };
    private const string SourceDir = "Assets/CapyniteImports";

    [MenuItem("Capynite Production/Verify Drako Panther Imported Rigs")]
    public static void Verify()
    {
        foreach (var name in Models)
        {
            var path = SourceDir + "/" + name + ".glb";
            var root = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (root == null)
                throw new Exception("Missing GLB imported as Unity prefab: " + path
                    + ". Install an editor glTF importer and copy the source GLB into CapyniteImports.");

            var meshes = root.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            if (meshes.Length == 0) throw new Exception(name + ": no skinned meshes imported");
            int bones = meshes.Sum(mesh => mesh.bones == null ? 0 : mesh.bones.Length);
            if (bones < 10) throw new Exception(name + ": fewer than ten imported rig bones");

            var clips = AssetDatabase.LoadAllAssetsAtPath(path).OfType<AnimationClip>()
                .Where(c => !c.name.StartsWith("__preview__", StringComparison.OrdinalIgnoreCase))
                .ToArray();
            if (clips.Length < 12) throw new Exception(name + ": fewer than 12 imported animation clips");

            foreach (var clip in clips)
            {
                if (clip == null || clip.length <= 0 || float.IsNaN(clip.length) || float.IsInfinity(clip.length))
                    throw new Exception(name + ": invalid animation clip duration");
            }
            Debug.Log("Capynite import structure OK: " + name +
                " | skinned meshes=" + meshes.Length + " | bones=" + bones +
                " | clips=" + clips.Length + " | ART REVIEW STILL REQUIRED");
        }
    }
}
