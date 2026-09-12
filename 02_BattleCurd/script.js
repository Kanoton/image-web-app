// 通常の「防御」を選択した場合の最終ダメージ
function getDefenseDamage(
    attackPower,
    defensePower,
    damageAdd,
    damageReduce,
    attackDice,
    defenseDice
) {
    const actualAttack = attackPower + attackDice;
    const actualDefense = defensePower + defenseDice;

    let damage = actualAttack - actualDefense;

    // 1未満のダメージは1に補正
    if (damage < 1) {
        damage = 1;
    }

    let finalDamage = damage + damageAdd - damageReduce;

    // 増加・軽減の計算後は0ダメージを許容する
    // （負のダメージにはならないよう0を下限とする）
    if (finalDamage < 0) {
        finalDamage = 0;
    }

    return finalDamage;
}


// 「回避」を選択した場合の最終ダメージ
function getEvadeDamage(
    attackPower,
    damageAdd,
    damageReduce,
    attackDice,
    defenseDice
) {
    // 攻撃側の出目より大きい、または6なら回避成功
    const evadeSuccess =
        defenseDice > attackDice || defenseDice === 6;

    if (evadeSuccess) {
        // 回避成功時は増加・軽減も計算せず0ダメージ
        return 0;
    }

    // 回避失敗時は防御力を0として計算
    const actualAttack = attackPower + attackDice;
    let damage = actualAttack;

    if (damage < 1) {
        damage = 1;
    }

    let finalDamage = damage + damageAdd - damageReduce;

    // 増加・軽減の計算後は0ダメージを許容する
    if (finalDamage < 0) {
        finalDamage = 0;
    }

    return finalDamage;
}


// 防御側：攻撃ダイスの出目ごとに「防御」と「回避」を比較
// 判定基準
// 1. 「防御」で100%生存できる出目では、必ず防御を推奨
// 2. 100%でない場合は、防御と回避の生存率を比較
// 3. 回避の生存率が高ければ回避
// 4. 生存率が同じなら、成功時に0ダメージとなる回避を推奨
function getDefenseRecommendation(
    attackPower,
    defensePower,
    damageAdd,
    damageReduce,
    hp
) {
    const evadeBetterDice = [];

    for (let attackDice = 1; attackDice <= 6; attackDice++) {
        let defenseSurvivalCount = 0;
        let evadeSurvivalCount = 0;

        for (let defenseDice = 1; defenseDice <= 6; defenseDice++) {
            const defenseDamage = getDefenseDamage(
                attackPower,
                defensePower,
                damageAdd,
                damageReduce,
                attackDice,
                defenseDice
            );

            const evadeDamage = getEvadeDamage(
                attackPower,
                damageAdd,
                damageReduce,
                attackDice,
                defenseDice
            );

            if (defenseDamage < hp) {
                defenseSurvivalCount++;
            }

            if (evadeDamage < hp) {
                evadeSurvivalCount++;
            }
        }

        // その攻撃出目に対して「防御」で100%生存できるなら防御を選ぶ
        if (defenseSurvivalCount === 6) {
            continue;
        }

        // 防御が100%でない場合：
        // 回避の生存率が高い、または同率なら回避を推奨
        if (evadeSurvivalCount >= defenseSurvivalCount) {
            evadeBetterDice.push(attackDice);
        }
    }

    // 推奨表示は3パターンに限定
    if (evadeBetterDice.length === 0) {
        return "回避不要";
    }

    if (
        evadeBetterDice.length === 1 &&
        evadeBetterDice[0] === 6
    ) {
        return "出目6の場合、回避";
    }

    return "回避を選択";
}

// ダメージごとの発生確率を、マーカーなしの折れ線グラフで描画
function renderDamageProbabilityGraph(
    calculator,
    damageCounts,
    maxDamage,
    totalCombinations,
    hp
) {
    const svg = calculator.querySelector(".damage-probability-graph");

    if (!svg) {
        return;
    }

    // 横軸は「実際に発生する最小ダメージ」から開始し、
    // 最大値は「最大ダメージ + 1」まで表示する
    const damageValues = Array.from(damageCounts.keys());
    const xMin = damageValues.length > 0
        ? Math.min(...damageValues)
        : 0;
    const xMax = Math.max(xMin + 1, maxDamage + 1);

    const probabilities = [];
    let maxProbability = 0;

    for (let damage = xMin; damage <= xMax; damage++) {
        const count = damageCounts.get(damage) || 0;
        const probability = (count / totalCombinations) * 100;

        probabilities.push({ damage, probability });
        maxProbability = Math.max(maxProbability, probability);
    }

    // 縦軸は5%の倍数から、見やすい目盛り間隔を自動選択する
    // 1目盛りは 5% / 10% / 15% / 20% のいずれか
    const yTickCandidates = [5, 10, 15, 20];
    let yTickStep = 20;

    for (const candidate of yTickCandidates) {
        // 目盛り数が多すぎない範囲（おおむね4～6本）で最小の刻みを採用
        const tickCount = Math.ceil(maxProbability / candidate);
        if (tickCount <= 6) {
            yTickStep = candidate;
            break;
        }
    }

    const yMax = Math.max(
        yTickStep,
        Math.ceil(maxProbability / yTickStep) * yTickStep
    );

    const width = 620;
    // 右側の表示エリアに近い縦横比にして、
    // SVG内部の上下の空白を減らす
    const height = 325;
    const margin = {
        top: 10,
        right: 15,
        bottom: 35,
        left: 50
    };

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const xToSvg = damage =>
        margin.left + ((damage - xMin) / (xMax - xMin)) * plotWidth;

    const yToSvg = probability =>
        margin.top + plotHeight - (probability / yMax) * plotHeight;

    const svgParts = [];

    // 折れ線と、その下側の領域を作るための座標
    const linePoints = probabilities
        .map(item => `${xToSvg(item.damage)},${yToSvg(item.probability)}`)
        .join(" ");

    const baselineY = margin.top + plotHeight;
    const areaPoints = [
        `${xToSvg(xMin)},${baselineY}`,
        ...probabilities.map(
            item => `${xToSvg(item.damage)},${yToSvg(item.probability)}`
        ),
        `${xToSvg(xMax)},${baselineY}`
    ].join(" ");

    svgParts.push(
        `<title>ダメージ発生確率</title>`,
        `<desc>折れ線より下側のうち、攻撃モードではHP以上、防御モードではHP未満の確率範囲を斜線で表示します。</desc>`
    );

    // 攻撃モード：HP以上 ＝ 撃破率
    // 防御モード：HP未満 ＝ 生存率
    const isDefenseMode = calculator.dataset.role === "defense";
    const hatchColor = isDefenseMode ? "#5f9bd3" : "#ef6b6b";
    const hatchPatternId = isDefenseMode
        ? "defense-survival-hatch"
        : "attack-defeat-hatch";
    const probabilityClipId = isDefenseMode
        ? "defense-probability-area"
        : "attack-probability-area";

    // 斜線は「確率の折れ線より下」だけに表示する
    svgParts.push(
        `<defs>
            <pattern id="${hatchPatternId}" patternUnits="userSpaceOnUse" width="8" height="8">
                <line x1="0" y1="8" x2="8" y2="0" stroke="${hatchColor}" stroke-width="1.5" stroke-opacity="0.30"></line>
            </pattern>
            <clipPath id="${probabilityClipId}">
                <polygon points="${areaPoints}"></polygon>
            </clipPath>
        </defs>`
    );

    // HPを境に、表示する確率範囲だけを斜線で塗る
    if (isDefenseMode) {
        // 防御側は「ダメージ < HP」が生存なので、HPより左側を塗る
        if (hp > xMin) {
            const hatchEndDamage = Math.min(hp, xMax);
            const hatchEndX = xToSvg(hatchEndDamage);
            const hatchWidth = hatchEndX - margin.left;

            if (hatchWidth > 0) {
                svgParts.push(
                    `<rect x="${margin.left}" y="${margin.top}" width="${hatchWidth}" height="${plotHeight}" fill="url(#${hatchPatternId})" clip-path="url(#${probabilityClipId})"></rect>`
                );
            }
        }
    } else {
        // 攻撃側は「ダメージ >= HP」が撃破なので、HPより右側を塗る
        if (hp <= xMax) {
            const hatchStartDamage = Math.max(hp, xMin);
            const hatchStartX = xToSvg(hatchStartDamage);
            const hatchWidth = margin.left + plotWidth - hatchStartX;

            if (hatchWidth > 0) {
                svgParts.push(
                    `<rect x="${hatchStartX}" y="${margin.top}" width="${hatchWidth}" height="${plotHeight}" fill="url(#${hatchPatternId})" clip-path="url(#${probabilityClipId})"></rect>`
                );
            }
        }
    }

    // HPが横軸の表示範囲内にある場合は境界線を表示
    if (hp >= xMin && hp <= xMax) {
        const hpX = xToSvg(hp);
        svgParts.push(
            `<line x1="${hpX}" y1="${margin.top}" x2="${hpX}" y2="${baselineY}" stroke="${hatchColor}" stroke-width="1.5" stroke-dasharray="5 4" stroke-opacity="0.75"></line>`
        );
    }

    // 横方向グリッドと縦軸目盛り
    const yTickCount = Math.round(yMax / yTickStep);
    for (let i = 0; i <= yTickCount; i++) {
        const probability = yTickStep * i;
        const y = yToSvg(probability);

        svgParts.push(
            `<line class="graph-grid" x1="${margin.left}" y1="${y}" x2="${margin.left + plotWidth}" y2="${y}"></line>`,
            `<text class="graph-label" x="${margin.left - 8}" y="${y + 4}" text-anchor="end">${probability.toFixed(0)}%</text>`
        );
    }

    // 縦方向グリッドと横軸目盛り
    for (let damage = xMin; damage <= xMax; damage++) {
        const x = xToSvg(damage);

        svgParts.push(
            `<line class="graph-grid" x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + plotHeight}"></line>`,
            `<text class="graph-label" x="${x}" y="${margin.top + plotHeight + 20}" text-anchor="middle">${damage}</text>`
        );
    }

    // 軸
    svgParts.push(
        `<line class="graph-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}"></line>`,
        `<line class="graph-axis" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}"></line>`
    );

    // マーカーなしの折れ線
    svgParts.push(
        `<polyline class="graph-line" points="${linePoints}"></polyline>`
    );

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.innerHTML = svgParts.join("");
}


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
    let maxDamage = 0;

    const damageCounts = new Map();
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
            // 表・期待値・撃破率/生存率は従来どおり「防御」選択時で計算
            const finalDamage = getDefenseDamage(
                attackPower,
                defensePower,
                damageAdd,
                damageReduce,
                attackDice,
                defenseDice
            );

            const cell = document.createElement("td");
            cell.textContent = finalDamage;

            if (finalDamage >= hp) {
                cell.classList.add("defeat");
                defeatCount++;
            } else {
                survivalCount++;
            }

            row.appendChild(cell);
            totalDamage += finalDamage;

            damageCounts.set(
                finalDamage,
                (damageCounts.get(finalDamage) || 0) + 1
            );

            maxDamage = Math.max(maxDamage, finalDamage);
        }

        tableBody.appendChild(row);
    }

    renderDamageProbabilityGraph(
        calculator,
        damageCounts,
        maxDamage,
        totalCombinations,
        hp
    );

    const expectedDamage =
        totalDamage / totalCombinations;

    calculator.querySelector(".expected-damage").textContent =
        expectedDamage.toFixed(2);

    if (isSurvival) {
        const survivalRate =
            (survivalCount / totalCombinations) * 100;

        calculator.querySelector(".result-rate").textContent =
            survivalRate.toFixed(2) + "%";

        const recommendation =
            calculator.querySelector(".defense-recommendation");

        if (recommendation) {
            recommendation.textContent =
                getDefenseRecommendation(
                    attackPower,
                    defensePower,
                    damageAdd,
                    damageReduce,
                    hp
                );
        }
    } else {
        const defeatRate =
            (defeatCount / totalCombinations) * 100;

        calculator.querySelector(".result-rate").textContent =
            defeatRate.toFixed(2) + "%";
    }
}


// 各モードを初期化
const modes = document.querySelectorAll(".mode-content");

modes.forEach(mode => {
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
const mainContainer = document.querySelector(".main-container");

document.querySelectorAll(".role-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        const selectedRole = tab.dataset.role;

        document.querySelectorAll(".role-tab").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.role === selectedRole
            );
        });

        modes.forEach(mode => {
            mode.classList.toggle(
                "active",
                mode.dataset.role === selectedRole
            );
        });

        mainContainer.classList.toggle(
            "attack-mode",
            selectedRole === "attack"
        );

        mainContainer.classList.toggle(
            "defense-mode",
            selectedRole === "defense"
        );
    });
});
