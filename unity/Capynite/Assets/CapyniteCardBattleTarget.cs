using System;
using UnityEngine;

/// <summary>
/// Self-contained, offline card-battle visual target prototype.
/// Uses primitive placeholders; no IP art or server-side rewards. Do not replace
/// existing Beast Arena gameplay until parity is proven.
/// </summary>
public sealed class CapyniteCardBattleTarget : MonoBehaviour
{
    private readonly string[] cards = { "SWITCH", "FIRESTORM", "VOLTIC TACKLE", "MAGMA BLAST", "IGNITE BLAST", "REST" };
    private readonly int[] costs = { 0, 2, 2, 3, 1, 0 };
    private readonly int[] damages = { 0, 18, 22, 30, 12, 0 };
    private readonly Color[] colors = {
        new Color(.22f,.72f,.35f),new Color(.94f,.27f,.22f),
        new Color(.25f,.50f,.96f),new Color(.87f,.22f,.36f),
        new Color(.94f,.39f,.16f),new Color(.15f,.71f,.86f)
    };
    private int playerHP=100, bossHP=120, energy=5, turn=1, bossStage=0;
    private bool won;
    private string feedback="Escolha uma carta para começar.";
    private float flashUntil;
    private GameObject playerActor, bossActor;
    private Renderer bossVisual;
    private static readonly string[] bosses={"Chief Capivara","Maga Capira","Capitão Corpivara","Capi Dragão","Imperador Capibaron"};

    private void Start()
    {
        var cam = Camera.main;
        if (!cam) { var c=new GameObject("Card Arena Camera"); c.tag="MainCamera"; cam=c.AddComponent<Camera>(); c.AddComponent<AudioListener>(); }
        cam.transform.position=new Vector3(0,9,-16);
        cam.transform.LookAt(new Vector3(0,1,0));
        cam.backgroundColor=new Color(.36f,.70f,.90f);
        cam.clearFlags=CameraClearFlags.SolidColor;
        var light=new GameObject("Sun").AddComponent<Light>();
        light.type=LightType.Directional;light.intensity=1.3f;light.transform.rotation=Quaternion.Euler(55,-30,0);
        Make("Battlefield",PrimitiveType.Cylinder,new Vector3(0,-.3f,0),new Vector3(16,.18f,10),new Color(.76f,.64f,.39f));
        playerActor=Make("Player creature placeholder",PrimitiveType.Capsule,new Vector3(-4,1,0),new Vector3(1.9f,1.8f,1.9f),new Color(.86f,.23f,.22f));
        bossActor=Make("Opponent creature placeholder",PrimitiveType.Capsule,new Vector3(4,1,0),new Vector3(2.5f,2.1f,2.5f),new Color(.25f,.62f,.82f));
        bossVisual=bossActor.GetComponent<Renderer>();
        for(int i=0;i<9;i++) {
            var a=i*6.283185f/9f;
            Make("Backdrop tree "+i,PrimitiveType.Cylinder,new Vector3(Mathf.Cos(a)*13f,1f,Mathf.Sin(a)*10f),new Vector3(.5f,2f,.5f),new Color(.21f,.46f,.31f));
        }
    }

    private GameObject Make(string n,PrimitiveType p,Vector3 pos,Vector3 scale,Color color)
    {
        var o=GameObject.CreatePrimitive(p);o.name=n;o.transform.position=pos;o.transform.localScale=scale;
        var mat=new Material(Shader.Find("Standard"));mat.color=color;o.GetComponent<Renderer>().material=mat;
        return o;
    }

    private void Play(int index)
    {
        if(won||playerHP<=0)return;
        if(index==0){feedback="Troca de criatura: disponível na versão com roster.";return;}
        if(index==5){playerHP=Math.Min(100,playerHP+16);feedback="Descanso: +16 HP";return;}
        if(energy<costs[index]){feedback="Energia insuficiente.";return;}
        energy-=costs[index];bossHP=Math.Max(0,bossHP-damages[index]);flashUntil=Time.time+.3f;
        feedback=cards[index]+" causou "+damages[index]+" de dano!";
        if(bossHP==0)NextBoss();
    }

    private void NextBoss()
    {
        bossStage++;
        if(bossStage>=bosses.Length){won=true;feedback="Vitória! Todos os cinco chefes derrotados.";return;}
        bossHP=120+bossStage*35;
        feedback="Próximo chefe: "+bosses[bossStage];
    }

    private void EndTurn()
    {
        if(won||playerHP<=0)return;
        playerHP=Math.Max(0,playerHP-(8+bossStage*2));
        turn++;energy=Math.Min(8,energy+3);
        feedback=playerHP==0?"Derrota. Reinicie para tentar novamente.":"Novo turno: +3 energia.";
    }

    private void Update()
    {
        if(Input.GetKeyDown(KeyCode.R)) UnityEngine.SceneManagement.SceneManager.LoadScene(
            UnityEngine.SceneManagement.SceneManager.GetActiveScene().buildIndex);
        if(Input.GetKeyDown(KeyCode.Return))EndTurn();
        for(int i=0;i<6;i++)if(Input.GetKeyDown(KeyCode.Alpha1+i))Play(i);
        if(bossVisual) bossVisual.material.color=Time.time<flashUntil?Color.white:new Color(.25f,.62f,.82f);
        if(playerActor)playerActor.transform.localScale=new Vector3(1.9f,1.8f+Mathf.Sin(Time.time*2f)*.05f,1.9f);
    }

    private void OnGUI()
    {
        float w=Screen.width,h=Screen.height;
        float scale=Mathf.Min(w/1366f,h/768f);
        var m=GUI.matrix;GUI.matrix=Matrix4x4.TRS(Vector3.zero,Quaternion.identity,new Vector3(scale,scale,1));
        float sw=w/scale,sh=h/scale;
        var title=new GUIStyle(GUI.skin.label){fontSize=23,fontStyle=FontStyle.Bold,alignment=TextAnchor.MiddleCenter,normal={textColor=Color.white}};
        var label=new GUIStyle(GUI.skin.label){fontSize=17,fontStyle=FontStyle.Bold,alignment=TextAnchor.MiddleCenter,wordWrap=true,normal={textColor=Color.white}};
        GUI.color=new Color(.05f,.11f,.21f,.92f);
        GUI.Box(new Rect(18,10,sw-36,126),"");
        GUI.color=Color.white;
        GUI.Label(new Rect(30,12,sw*.38f,42),"CAPYNITE  |  HP "+playerHP+"  •  ENERGY "+energy,title);
        GUI.Label(new Rect(sw*.38f,10,sw*.24f,52),"BOSS "+Math.Min(5,bossStage+1)+"/5",title);
        GUI.Label(new Rect(sw*.60f,12,sw*.37f,42),bosses[Math.Min(4,bossStage)]+"  |  HP "+bossHP,title);
        GUI.Label(new Rect(30,73,sw-60,35),feedback,label);
        float gap=10f,cardWidth=Mathf.Min(154,(sw-100-5*gap)/6f),start=(sw-(6*cardWidth+5*gap))/2f;
        float y=sh-192;
        for(int i=0;i<6;i++)
        {
            GUI.color=colors[i];GUI.Box(new Rect(start+i*(cardWidth+gap),y,cardWidth,146),"");
            GUI.color=Color.white;
            GUI.Label(new Rect(start+i*(cardWidth+gap)+5,y+10,cardWidth-10,75),cards[i],label);
            GUI.Label(new Rect(start+i*(cardWidth+gap)+4,y+86,cardWidth-8,27),"CUSTO "+costs[i]+"  •  "+(damages[i]>0?damages[i]+" DMG":"UTILITY"),label);
            if(GUI.Button(new Rect(start+i*(cardWidth+gap)+8,y+117,cardWidth-16,23),"USAR ["+(i+1)+"]"))Play(i);
        }
        GUI.color=Color.white;
        if(GUI.Button(new Rect(sw-220,sh-42,198,36),"END TURN [ENTER]"))EndTurn();
        GUI.Label(new Rect(20,sh-42,300,32),"R: reiniciar • Turno "+turn,label);
        GUI.matrix=m;
    }
}
