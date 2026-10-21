using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// Runnable offline vertical slice: four canonical heroes vs five campaign bosses.
/// Uses primitives as deliberate placeholder art; no player rewards/network writes.
/// WASD / arrows move, Space attack, Shift dodge; 1-4 select hero, R restart.
/// </summary>
public sealed class CapyniteBossArena : MonoBehaviour
{
    private static readonly string[] Heroes = { "Capivini", "Capininja", "Capirocket", "Capizozo" };
    private static readonly string[] Bosses = { "Chief Capivara", "Maga Capira", "Capitão Corpivara", "Capi Dragão", "Imperador Capibaron" };
    private static readonly Color[] BossColors = {
        new Color(.75f,.25f,.18f), new Color(.55f,.30f,.85f),
        new Color(.72f,.32f,.21f), new Color(.95f,.27f,.10f), new Color(.95f,.72f,.22f)
    };
    private Transform hero;
    private Transform boss;
    private Renderer heroRenderer;
    private Renderer bossRenderer;
    private int selectedHero;
    private int stage;
    private float heroHp=100f;
    private float bossHp=100f;
    private float attackCooldown;
    private float enemyCooldown=1.5f;
    private float invulnerableUntil;
    private float flashUntil;
    private string status = "Vença os cinco chefes!";
    private bool completed;
    private Camera gameCamera;
    private readonly Vector3 center = new Vector3(0,0,0);

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void Bootstrap()
    {
        if (Object.FindObjectOfType<CapyniteBossArena>() == null)
            new GameObject("Capynite Boss Arena").AddComponent<CapyniteBossArena>();
    }

    private static GameObject Primitive(string name, PrimitiveType type, Vector3 pos, Vector3 scale, Color color)
    {
        var go=GameObject.CreatePrimitive(type);
        go.name=name;
        go.transform.position=pos;
        go.transform.localScale=scale;
        var mat=new Material(Shader.Find("Standard"));
        mat.color=color;
        go.GetComponent<Renderer>().material=mat;
        return go;
    }

    private void Start()
    {
        QualitySettings.vSyncCount=1;
        Application.targetFrameRate=60;
        Primitive("Arena floor",PrimitiveType.Cylinder,center+Vector3.down*.25f,new Vector3(17,.2f,12),new Color(.11f,.15f,.26f));
        for (int i=0;i<12;i++)
        {
            float angle=i*Mathf.PI*2f/12f;
            Primitive("Crystal "+i,PrimitiveType.Cube,
                new Vector3(Mathf.Cos(angle)*12f,1.4f,Mathf.Sin(angle)*8f),
                new Vector3(.8f,2.8f,.8f),i%2==0?new Color(.21f,.85f,.96f):new Color(.72f,.54f,1f));
        }
        hero=Primitive("Playable Capynite",PrimitiveType.Capsule,new Vector3(-4,1,0),new Vector3(1.4f,1.4f,1.4f),new Color(.8f,.49f,.24f)).transform;
        boss=Primitive("Campaign Boss",PrimitiveType.Capsule,new Vector3(4,1,0),new Vector3(2,2,2),BossColors[0]).transform;
        heroRenderer=hero.GetComponent<Renderer>();
        bossRenderer=boss.GetComponent<Renderer>();
        var lightObj=new GameObject("Arena light");
        var light=lightObj.AddComponent<Light>();
        light.type=LightType.Directional;light.intensity=1.4f;
        lightObj.transform.rotation=Quaternion.Euler(55,-25,0);
        gameCamera=Camera.main;
        if (gameCamera==null)
        {
            var cam=new GameObject("Main Camera");cam.tag="MainCamera";
            gameCamera=cam.AddComponent<Camera>();
            cam.AddComponent<AudioListener>();
        }
        gameCamera.transform.position=new Vector3(0,12,-18);
        gameCamera.transform.LookAt(new Vector3(0,1,0));
        gameCamera.clearFlags=CameraClearFlags.SolidColor;
        gameCamera.backgroundColor=new Color(.025f,.025f,.075f);
    }

    private void Update()
    {
        if(Input.GetKeyDown(KeyCode.R)){ Restart();return; }
        for(int i=0;i<4;i++) if(Input.GetKeyDown(KeyCode.Alpha1+i)) SwitchHero(i);
        if(completed)return;
        if(heroHp<=0){status="Você caiu! Pressione R para tentar novamente.";return;}
        var axis=new Vector3(Input.GetAxisRaw("Horizontal"),0,Input.GetAxisRaw("Vertical"));
        if(axis.sqrMagnitude>1)axis.Normalize();
        hero.position+=axis*6f*Time.deltaTime;
        hero.position=new Vector3(Mathf.Clamp(hero.position.x,-8,8),1,Mathf.Clamp(hero.position.z,-5,5));
        boss.LookAt(new Vector3(hero.position.x,1,hero.position.z));
        if(axis.sqrMagnitude>.01f)hero.LookAt(hero.position+axis);
        if(Input.GetKeyDown(KeyCode.LeftShift)||Input.GetKeyDown(KeyCode.RightShift))
        {
            invulnerableUntil=Time.time+.7f;
            hero.position=new Vector3(Mathf.Clamp(hero.position.x+axis.x*2f,-8,8),1,Mathf.Clamp(hero.position.z+axis.z*2f,-5,5));
        }
        attackCooldown-=Time.deltaTime;
        enemyCooldown-=Time.deltaTime;
        if(Input.GetKey(KeyCode.Space)&&attackCooldown<=0)
        {
            attackCooldown=selectedHero==1?.24f:selectedHero==2?.65f:.4f;
            float distance=Vector3.Distance(hero.position,boss.position);
            float range=selectedHero==2?12f:selectedHero==1?3f:6f;
            if(distance<=range)
            {
                bossHp-=selectedHero==2?19f:selectedHero==1?12f:16f;
                flashUntil=Time.time+.12f;
                if(bossHp<=0){NextStage();return;}
            }
        }
        if(enemyCooldown<=0)
        {
            enemyCooldown=Mathf.Max(.45f,1.5f-stage*.17f);
            if(Vector3.Distance(hero.position,boss.position)>2.7f)
                boss.position=Vector3.MoveTowards(boss.position,hero.position,1.25f);
            else if(Time.time>=invulnerableUntil)
                heroHp=Mathf.Max(0,heroHp-(10+stage*3));
        }
        bossRenderer.material.color=Time.time<flashUntil?Color.white:BossColors[stage];
    }

    private void NextStage()
    {
        stage++;
        heroHp=Mathf.Min(100,heroHp+25);
        if(stage>=Bosses.Length)
        {
            completed=true;
            status="CAPYNITE VENCEU! Cinco chefes derrotados. R para reiniciar.";
            boss.gameObject.SetActive(false);
            return;
        }
        bossHp=100+stage*30;
        boss.position=new Vector3(4,1,0);
        bossRenderer.material.color=BossColors[stage];
        status="Novo chefe: "+Bosses[stage];
    }

    private void SwitchHero(int index)
    {
        selectedHero=index;
        status=Heroes[index]+" entrou na arena!";
    }

    private void Restart()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    private void OnGUI()
    {
        var style=new GUIStyle(GUI.skin.label){fontSize=20,fontStyle=FontStyle.Bold,normal={textColor=Color.white}};
        GUI.Box(new Rect(12,12,Screen.width-24,132),"");
        GUI.Label(new Rect(30,20,Screen.width-50,30),"CAPYNITE — BOSS ARENA  |  Fase "+Mathf.Min(stage+1,5)+"/5",style);
        GUI.Label(new Rect(30,52,Screen.width-50,30),Heroes[selectedHero]+" HP: "+Mathf.CeilToInt(heroHp)+"   VS   "+(completed?"CAMPEÕES":Bosses[stage]+" HP: "+Mathf.CeilToInt(Mathf.Max(0,bossHp))),style);
        GUI.Label(new Rect(30,85,Screen.width-50,50),status,style);
        GUI.Label(new Rect(24,Screen.height-80,Screen.width-48,65),"WASD / Setas: mover    ESPAÇO: atacar    SHIFT: esquivar    1–4: trocar herói    R: reiniciar",style);
    }
}
