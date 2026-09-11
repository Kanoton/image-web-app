function calculateDamage(calculator) {

    // 入力された値を取得する
    const attackPower =
        Number(calculator.querySelector('[id^="attackPower"]').value);

    const damageAdd =
        Number(calculator.querySelector('[id^="damageAdd"]').value);

    const hp =
        Number(calculator.querySelector('[id^="hp"]').value);

    const defensePower =
        Number(calculator.querySelector('[id^="defensePower"]').value);

    const damageReduce =
        Number(calculator.querySelector('[id^="damageReduce"]').value);


    // ダメージ表を取得
    const tableBody =
        calculator.querySelector(".damage-table tbody");

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


        // 「攻撃」を6行にまたがって表示
        if (attackDice === 1) {
            const attackLabel = document.createElement("th");
            attackLabel.textContent = "攻撃";
            attackLabel.rowSpan = 6;
            attackLabel.classList.add("attack-label");
            row.appendChild(attackLabel);
        }


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


            // HP以上のダメージなら撃破可能として色を付ける
            if (finalDamage >= hp) {
                cell.classList.add("defeat");
            }

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
    calculator.querySelector(".expected-damage").textContent =
        expectedDamage.toFixed(2);

    calculator.querySelector(".defeat-rate").textContent =
        defeatRate.toFixed(2) + "%";
}


// 各計算ツールを初期化
document.querySelectorAll(".calculator").forEach(calculator => {

    // 入力値が変更されたら自動的に計算する
    calculator.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener("input", () => calculateDamage(calculator));
    });

    // ＋ボタンで入力値を変更する
    calculator.querySelectorAll(".plus-button").forEach(button => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.target);

            input.value = Number(input.value) + 1;
            input.dispatchEvent(new Event("input"));
        });
    });

    // −ボタンで入力値を変更する
    calculator.querySelectorAll(".minus-button").forEach(button => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.target);

            const newValue = Number(input.value) - 1;

            if (newValue >= 0) {
                input.value = newValue;
                input.dispatchEvent(new Event("input"));
            }
        });
    });

    // ページを開いたときにも計算する
    calculateDamage(calculator);
});
