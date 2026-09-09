function calculateDamage() {

    // 入力された値を取得する
    const attackPower =
        Number(document.getElementById("attackPower").value);

    const damageAdd =
        Number(document.getElementById("damageAdd").value);

    const hp =
        Number(document.getElementById("hp").value);

    const defensePower =
        Number(document.getElementById("defensePower").value);

    const damageReduce =
        Number(document.getElementById("damageReduce").value);


    // ダメージ表を取得
    const tableBody =
        document.querySelector("#damageTable tbody");

    // 表を一度空にする
    tableBody.innerHTML = "";


    // 期待値計算用
    let totalDamage = 0;

    // 撃破できる組み合わせ数
    let defeatCount = 0;

    // ダイスの組み合わせ数
    const totalCombinations = 36;


    // 攻撃側のダイス 1～6
    for (let attackDice = 1; attackDice <= 6; attackDice++) {

        // 表の1行を作る
        const row = document.createElement("tr");

        // 攻撃側ダイスの表示
        const attackCell = document.createElement("th");
        attackCell.textContent = attackDice;
        row.appendChild(attackCell);


        // 防御側のダイス 1～6
        for (let defenseDice = 1; defenseDice <= 6; defenseDice++) {

            // 実際の攻撃力
            const actualAttack =
                attackPower + attackDice;

            // 実際の防御力
            const actualDefense =
                defensePower + defenseDice;


            // 基本ダメージ
            let damage =
                actualAttack - actualDefense;


            // 0未満なら1
            if (damage < 1) {
                damage = 1;
            }


            // 加算・軽減
            let finalDamage =
                damage + damageAdd - damageReduce;


            // 最終ダメージが0未満なら1
            if (finalDamage < 1) {
                finalDamage = 1;
            }


            // 表のセルを作る
            const cell = document.createElement("td");

            cell.textContent = finalDamage;

            row.appendChild(cell);


            // 期待値計算用にダメージを加算
            totalDamage += finalDamage;


            // HP以上のダメージなら撃破
            if (finalDamage >= hp) {
                defeatCount++;
            }
        }


        // 表に行を追加
        tableBody.appendChild(row);
    }


    // ダメージ期待値
    const expectedDamage =
        totalDamage / totalCombinations;


    // 撃破確率
    const defeatRate =
        (defeatCount / totalCombinations) * 100;


    // 結果を表示
    document.getElementById("expectedDamage").textContent =
        expectedDamage.toFixed(2);

    document.getElementById("defeatRate").textContent =
        defeatRate.toFixed(2) + "%";
}


// 入力値が変更されたら自動的に計算する
document.getElementById("attackPower").addEventListener("input", calculateDamage);
document.getElementById("damageAdd").addEventListener("input", calculateDamage);
document.getElementById("hp").addEventListener("input", calculateDamage);
document.getElementById("defensePower").addEventListener("input", calculateDamage);
document.getElementById("damageReduce").addEventListener("input", calculateDamage);


// ページを開いたときにも計算する
calculateDamage();
