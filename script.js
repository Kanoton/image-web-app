function calculateDamage(calculator, isSurvival = false) {

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

    const tableBody =
        calculator.querySelector(".damage-table tbody");

    tableBody.innerHTML = "";

    let totalDamage = 0;
    let defeatCount = 0;
    let survivalCount = 0;

    const totalCombinations = 36;

    for (let attackDice = 1; attackDice <= 6; attackDice++) {

        const row = document.createElement("tr");

        if (attackDice === 1) {
            const attackLabel = document.createElement("th");
            attackLabel.textContent = "攻撃";
            attackLabel.rowSpan = 6;
            attackLabel.classList.add("attack-label");
            row.appendChild(attackLabel);
        }

        const attackCell = document.createElement("th");
        attackCell.textContent = attackDice;
        row.appendChild(attackCell);

        for (let defenseDice = 1; defenseDice <= 6; defenseDice++) {

            const actualAttack =
                attackPower + attackDice;

            const actualDefense =
                defensePower + defenseDice;

            let damage =
                actualAttack - actualDefense;

            if (damage < 1) {
                damage = 1;
            }

            let finalDamage =
                damage + damageAdd - damageReduce;

            if (finalDamage < 1) {
                finalDamage = 1;
            }

            const cell = document.createElement("td");
            cell.textContent = finalDamage;

            // 上段・下段ともに「HP以上」で色を付ける
            if (finalDamage >= hp) {
                cell.classList.add("defeat");
                defeatCount++;
            } else {
                survivalCount++;
            }

            row.appendChild(cell);

            totalDamage += finalDamage;
        }

        tableBody.appendChild(row);
    }

    const expectedDamage =
        totalDamage / totalCombinations;

    calculator.querySelector(".expected-damage").textContent =
        expectedDamage.toFixed(2);

    if (isSurvival) {
        const survivalRate =
            (survivalCount / totalCombinations) * 100;

        calculator.querySelector(".result-rate").textContent =
            survivalRate.toFixed(2) + "%";
    } else {
        const defeatRate =
            (defeatCount / totalCombinations) * 100;

        calculator.querySelector(".result-rate").textContent =
            defeatRate.toFixed(2) + "%";
    }
}


// 各モードを初期化
document.querySelectorAll(".mode-content").forEach(mode => {

    const isSurvival =
        mode.dataset.role === "defense";

    mode.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener("input", () => {
            calculateDamage(mode, isSurvival);
        });
    });

    mode.querySelectorAll(".plus-button").forEach(button => {
        button.addEventListener("click", () => {
            const input =
                document.getElementById(button.dataset.target);

            input.value = Number(input.value) + 1;
            input.dispatchEvent(new Event("input"));
        });
    });

    mode.querySelectorAll(".minus-button").forEach(button => {
        button.addEventListener("click", () => {
            const input =
                document.getElementById(button.dataset.target);

            const newValue =
                Number(input.value) - 1;

            if (newValue >= 0) {
                input.value = newValue;
                input.dispatchEvent(new Event("input"));
            }
        });
    });

    calculateDamage(mode, isSurvival);
});


// 攻撃・防御タブの切り替え
document.querySelectorAll(".role-tab").forEach(tab => {

    tab.addEventListener("click", () => {

        const selectedRole = tab.dataset.role;

        document.querySelectorAll(".role-tab").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.role === selectedRole
            );
        });

        document.querySelectorAll(".mode-content").forEach(mode => {
            mode.classList.toggle(
                "active",
                mode.dataset.role === selectedRole
            );
        });
    });
});
