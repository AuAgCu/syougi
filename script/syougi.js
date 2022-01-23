"use strict";

window.onload = function(){
  init();
};


function init(){    //初期化
  var table = document.getElementById("syougiban");   //tableにマス目を作成する
  var gameover = false;
  var flag = false;      //駒の移動時に使う
  var turn = true;      //trueの時自分の番
  var motigoma =[[],[]];
  
  for(var i=0; i<9; i++){                       //将棋盤作成
    var tr = document.createElement("tr");
    for(var j=0; j<9; j++){
      var td = document.createElement("td");
      td.className = "cell";
      td.id = "cell"+i+j;       //idは "cell"+y+x となる
      td.onclick = clickSyougiban;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  
  var Koma = function(name, mine, x, y){      //将棋ゴマのプロトタイプ
    this.name = name;
    this.mine = mine;   //trueなら自軍,falseなら敵軍
    this.x = x;
    this.y = y;
    this.reversed = false;
    this.head = name;   //表の値を保持する
    this.alive = true;
  };
  
  Koma.prototype = {
    /*.....................geterとseter.................................*/
    getName : function(){
      return this.name;
    },
    
    setName : function(name){
      this.name = name;
    },
    
    getX : function(){
      return this.x;
    },
    
    setX : function(x){
      this.x = x;
    },
    
    getY : function(){
      return this.y;
    },
    
    setY :function(y){
      this.y = y;
    },
    
    setPosition : function(x,y){
      this.setX(x);
      this.setY(y);
    },
    
    getMine : function(){
      return this.mine;
    },
    
    setMine : function(mine){
      this.mine = mine;
    },
    
    getReversed : function(){
      return this.reversed;
    },
    
    setReversed : function(reversed){
      this.reversed = reversed;
    },
    
    getHead : function(){
      return this.head;
    },
    
    getAlive : function(){
      return this.alive;
    },
    
    setAlive : function(alive){
      this.alive = alive;
    },
    /*........................geterとseterここまで..........................*/
    
    movable : function(x, y){       //[x, y]が移動可能か判定する
      if((x<0||8<x) || (y<0||8<y)){   //将棋盤からはみ出さないか
        return false;
      }
      
      if(syougiban[y][x] != null && this.getMine() == syougiban[y][x].getMine()){    //移動先が自分の駒だったら移動できない
        return false;
      }
      
      document.getElementById("cell"+y+x).style.backgroundColor = "#00ff00";
      return true; 
    },
    
    findMovable : function(){    //移動可能な場所を列挙してlistに格納
      var movableArray = map[this.getName()];
      var list = [];
      for(var i=0; i<movableArray.length; i++){
        if(typeof(movableArray[i]) == "function"){ //関数が入ってた場合関数を実行
          movableArray[i](this, list, this.getX(), this.getY());
        }else{
          var x = movableArray[i][0];
          var y = movableArray[i][1];
          var sum_x = this.getX() + x;
          var sum_y = this.getMine() ? (this.getY() - y) : (this.getY() + y);
          
          if(this.movable(sum_x, sum_y)){   //移動可能だったらlistにpush
            list.push([sum_x, sum_y]);
          }
        }
      }
      return list;
    },
  
    action : function(x, y){        //その番の行動, 駒の移動か持ち駒から置くことができる
      if(this.getAlive()){    //盤上の駒の時
        this.move(x, y);
      }else{                  //持ち駒の時
        this.put(x, y);
      }
      
      var classList = document.getElementById("cell"+y+x).classList;
      if(this.getMine()){
        classList.remove("enemy");
      }else{
        classList.add("enemy");
      }

      if(this.getReversed()){
        classList.add("reverse");
      }else{
        classList.remove("reverse");
      }
      
      turn = !turn;
    },
    
    move : function(x,y){   //将棋盤から駒を移動する処理
      if(this.getMine()){                   //成る時の処理
        if((y <= 2) || (this.getY() <= 2)){
          this.reverse();
        }
      }else{
        if((y >= 6) || (this.getY() >=6)){
          this.reverse();
        }
      }
      
      var moveCell = document.getElementById("cell"+y+x);
      moveCell.textContent = this.getName();
      var destination = syougiban[y][x];    //移動先の状態を格納
      if(destination){           //移動先に駒（敵）がある時
        this.getKoma(destination);
      }
      syougiban[y][x] = this;
      syougiban[this.getY()][this.getX()] = null;     //移動前の場所をnullに
      document.getElementById("cell"+this.getY()+this.getX()).textContent = "";
      this.setPosition(x, y);
    },
    
    put : function(x, y){       //持ち駒から将棋盤に駒を置く処理
      syougiban[y][x] = this;
      this.setPosition(x, y);
      var moveCell = document.getElementById("cell"+y+x);
      moveCell.textContent = this.getName();
      this.setAlive(true);
      var n = this.getMine() ? 0 : 1;
      
      var pos = motigoma[n].indexOf(this);
      motigoma[n].splice(pos, 1);           //置いた駒を配列から削除
      var tr = document.getElementById("motigoma"+n);
      tr.removeChild(tr.childNodes[0]);

      motigoma[n].sort();
      this.update(n);
    },
    
    reverse : function(){       //駒を裏返す
      if(reverseMap[this.getName()] && confirm("成りますか?")){      //
        this.name = reverseMap[this.getName()];
      }
      this.setReversed(true);
    },
    
    getKoma : function(destination){      //駒を取る処理
      if(komaStrength[destination.getName()] == Infinity){    //とった駒が王か玉の時
        gameover = true;
        if(this.getMine()){
          alert("あなたの勝ちです");
        }else{
          alert("あなたの負けです");
        }
      }
      
      var n = this.getMine() ? 0 : 1;
      this.kill(destination);     //とった駒を初期状態に
      motigoma[n].push(destination);      //とった駒を持ち駒にpush
      var td = document.createElement("td");
      var tr = document.getElementById("motigoma"+n);
      td.className = "motigoma";
      td.classList.add("cell");
      td.onclick = clickMotigoma;
      tr.appendChild(td);
      motigoma[n].sort(komaCompare);
      this.update(n);
    },
    
    update : function(n){
      var tds = document.getElementById("motigoma"+n).childNodes;
      for(var i=0; i<motigoma[n].length; i++){
        td = tds.item(i);
        td.textContent = motigoma[n][i].head;
        var y = this.getMine() ? 0 : 1;       //自分の駒の場合0,敵の駒の場合1でidを "motigoma y x"の形で代入 
        td.id = "motigoma"+y+i;
      }
    },
    
    findPutable : function(){
      var list=[];
      var n = 0;
      if(this.getName() == "桂"){
        n = 2;
      }else if(this.getName() == "香" || this.getName() =="歩"){
        n = 1;
      }

      if(this.getMine() == turn){
        var first,end;
        if(this.getMine()){
          first = n;
          end = 9;
        }else{
          first = 0;
          end = 9 - n;
        }
        for(var i=first; i<end; i++){
          for(var j=0; j<9; j++){
            if(this.putable(j,i)){
              document.getElementById("cell"+i+j).style.backgroundColor ="#00ff00";
              list.push([j,i]);
            }
          }
        }
        
        return list;
      }
    },
    
    putable : function(x,y){
      if(syougiban[y][x]){    //x,yに駒がある時
        return false;
      }else if(this.getName() == "歩" && this.nihu(x)){
        return false;
      }
      return true;
    },
    
    nihu : function(x){     //  に歩ならtrue
      for(var i=0; i<9; i++){
        var tmp = syougiban[i][x];
        if(tmp && tmp.getName() == "歩"){
          if(turn == tmp.getMine()){
            return true;
          }
        }
      }
      return false;
    },
    
    kill : function(koma){
      koma.setMine(!koma.getMine());
      koma.setReversed(false);
      koma.setAlive(false);
      koma.setName(koma.getHead());
    }
  }
  
  var syougiban = new Array(9);     //将棋盤
  for(var i=0; i<9; i++){
    syougiban[i] = (new Array(9)).fill(null);
  }
  
  var map = {    //[x,y]の形で移動できる場所を格納
    "歩": [[0,1]], 
    "香": [kyousya], 
    "桂": [[1,2],[-1,2]], 
    "銀": [[0,1],[1,1],[-1,1],[-1,-1],[1,-1]], 
    "金": [[1,1],[0,1],[1,0],[0,-1],[-1,1],[-1,0]], 
    "飛": [hisya], 
    "角": [kaku] ,
    "王": [[1,1],[0,1],[1,0],[0,-1],[-1,1],[-1,0],[1,-1],[-1,-1]], 
    "玉": [[1,1],[0,1],[1,0],[0,-1],[-1,1],[-1,0],[1,-1],[-1,-1]],
    
    "龍": [hisya,[1,1],[1,-1],[-1,1],[-1,-1]],
    "馬": [kaku,[0,1],[1,0],[0,-1],[-1,0]]
  };
  
  var reverseMap = {      //駒とその裏側を格納
    "歩": "金",
    "飛": "龍",
    "角": "馬",
    "香": "金",
    "桂": "金",
    "銀": "金"
  };
  
  var komaStrength = {    //駒の強さを格納, 数字が大きい方が強い
    "歩": 1, 
    "香": 5, 
    "桂": 6, 
    "銀": 10, 
    "金": 15, 
    "飛": 50, 
    "角": 30 ,
    "王": Infinity, 
    "玉": Infinity,
    
    "龍": 100,
    "馬": 80
  };
  
  banInit(syougiban);   //駒を配置するメソッド
  
  function banInit(syougiban){    //駒を初期状態に
    haiti2("香",0,0);
    haiti2("桂",0,1);
    haiti2("銀",0,2);
    haiti2("金",0,3);
    haiti2("金",0,5);
    haiti2("銀",0,6);
    haiti2("桂",0,7);
    haiti2("香",0,8);

    haiti2("飛",1,1);
    haiti2("角",1,7);
    haiti("玉",0,4,false);
    haiti("王",8,4,true);

    for(var i=0; i<9; i++){
      haiti2("歩",2,i);
    }
    
    
    function haiti2(value,i,j){
      haiti(value, i, j, false);
      haiti(value, 8-i, 8-j, true);
    }
    
    function haiti(value,i,j,mine){
      syougiban[i][j] = new Koma(value,mine,j,i);
      var cell = document.getElementById("cell"+i+j);
      cell.textContent = value;
      if(mine){
        cell.classList.add("mikata");
      }else{
        cell.classList.add("enemy");
      }
    }
  }
  
  
  var array = [];
  var lastTarget;
  function clickSyougiban(e){
    if(gameover){
      return;
    }
    var target = e.target;
    
    var id = target.id.replace("cell","");
    var x = Number(id) % 10;
    var y = Math.floor(Number(id)/10);
    
    
    if(!flag){                  //flag==false  駒クリック前
      flag = komaclick();
    }else{                      //flag==true  駒クリック後
      var tmp = false;
      for(var i=0; i<array.length; i++){
        if(array[i].toString() == [x,y].toString()){
          lastTarget.action(x, y);
          cellFill();
          flag = false;
          tmp = true;
          break;
        }
      }
      if(!tmp){
        flag = komaclick();
      }
    }
    lastTarget = syougiban[y][x];
    
    function komaclick(){
      var tmp =false;
      cellFill();       //cellの色を初期化
      if(syougiban[y][x] != null && syougiban[y][x].getMine() == turn){
        array = syougiban[y][x].findMovable();
        if(array.length != 0){
          tmp = true;
        }
      }
      return tmp;
    }
  }
  
  function clickMotigoma(e){
    if(gameover){
      return;
    }
    cellFill();
    
    var target = e.target;
    var id = target.id.replace("motigoma","");
    var x = Number(id) % 10;
    var mine = Math.floor(Number(id)/10);

    var koma = motigoma[mine][x];
    if(koma.getMine()==turn){
      target.style.backgroundColor = "#00ff00";
      array = koma.findPutable();
      lastTarget = koma;
      flag = true;
    }
  }
  
  function cellFill(){          //cellの色を全てantiquewhiteにする
    var list = document.getElementsByClassName("cell");
    for(var i=0; i<list.length; i++){
      list.item(i).style.backgroundColor = "antiquewhite";
    }
  }
  
  function kyousya(koma, list, x, y){     //香車の移動判定.komaはKomaクラス,(x,y)はkomaの位置
    goStraight(koma, list, x, y, 0, 1);
  }
  
  function hisya(koma, list, x, y){
    goStraight(koma, list, x, y, 0, 1);
    goStraight(koma, list, x, y, 1, 0);    
    goStraight(koma, list, x, y, -1, 0);    
    goStraight(koma, list, x, y, 0, -1);    
  }
  
  function kaku(koma, list, x, y){
    goStraight(koma, list, x, y, 1, 1);
    goStraight(koma, list, x, y, 1, -1);
    goStraight(koma, list, x, y, -1, -1);
    goStraight(koma, list, x, y, -1, 1);
  }
  
  function goStraight(koma, list, x, y, x_dif, y_dif){    // dif は差分
    var x_sum = x + x_dif;
    var y_sum = koma.getMine() ? (y - y_dif) : (y + y_dif);
    
    if(koma.movable(x_sum, y_sum)){
      list.push([x_sum, y_sum]);
      if((syougiban[y_sum][x_sum])==null){     // 相手の駒にぶち当たったらstop
        goStraight(koma, list, x_sum, y_sum, x_dif, y_dif);
      }
    }
  }
  
  function komaCompare(koma1, koma2){
    return komaStrength[koma2.getName()] - komaStrength[koma1.getName()];
  }
}