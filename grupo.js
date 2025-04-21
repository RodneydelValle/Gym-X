// grupo.js actualizado con vista colapsable por ejercicio

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where, orderBy, getDocs,
  deleteDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZrqT-PX55Ms6fWSUIT8RN4L_Uk-j5qTI",
  authDomain: "gym-x-fc353.firebaseapp.com",
  projectId: "gym-x-fc353",
  storageBucket: "gym-x-fc353.appspot.com",
  messagingSenderId: "71761642354",
  appId: "1:71761642354:web:13edefbd57ff8263f053eb",
  measurementId: "G-XW80GUJL1D8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const params = new URLSearchParams(location.search);
const usuario = params.get("nombre") || "Usuario";
const grupo = params.get("grupo") || "Grupo";

document.getElementById("tituloGrupo").textContent = `${usuario} - ${grupo}`;

window.crearEjercicio = function () {
  const nombre = document.getElementById("nuevoEjercicioNombre").value.trim();
  if (!nombre) return alert("Escribe el nombre del ejercicio");

  agregarEjercicioUI(nombre);
  document.getElementById("nuevoEjercicioNombre").value = "";
};

function agregarEjercicioUI(nombreEjercicio) {
  const container = document.getElementById("ejerciciosContainer");

  const box = document.createElement("div");
  box.className = "ejercicio-box";
  box.innerHTML = `
    <details>
      <summary><strong>${nombreEjercicio}</strong></summary>
      <div class="contenido-ejercicio">
        <label class="campo">Peso (kg): <input type="number" class="peso"></label>
        <label class="campo">Series: <input type="number" class="series"></label>
        <label class="campo">Repeticiones: <input type="number" class="reps"></label>
        <label class="campo">Comentario: <input type="text" class="comentario"></label>
        <button class="guardarBtn">Guardar avance</button>
        <div class="avance-lista"></div>
      </div>
    </details>
  `;
  container.appendChild(box);

  const btn = box.querySelector(".guardarBtn");
  btn.onclick = async () => {
    const peso = Number(box.querySelector(".peso").value);
    const series = Number(box.querySelector(".series").value);
    const repes = Number(box.querySelector(".reps").value);
    const comentario = box.querySelector(".comentario").value;

    if (!peso || !series || !repes) {
      alert("Completa todos los campos");
      return;
    }

    const ref = await addDoc(collection(db, "progresoGym"), {
      usuario,
      grupo,
      ejercicio: nombreEjercicio,
      peso,
      series,
      repeticiones: repes,
      comentario,
      timestamp: Date.now()
    });

    mostrarAvance(box.querySelector(".avance-lista"), {
      peso, series, repeticiones: repes, comentario
    }, ref.id);

    box.querySelector(".peso").value = "";
    box.querySelector(".series").value = "";
    box.querySelector(".reps").value = "";
    box.querySelector(".comentario").value = "";
  };
}

function mostrarAvance(container, data, docId = null) {
  const div = document.createElement("div");
  div.className = "avance-item";
  div.innerHTML = `
    <strong>${data.peso} kg</strong><br>
    ${data.series} x ${data.repeticiones}<br>
    <em>${data.comentario || ''}</em><br>
    <button>📝 Editar</button>
    <button>🗑 Eliminar</button>
  `;

  const [btnEditar, btnEliminar] = div.querySelectorAll("button");

  btnEliminar.onclick = async () => {
    if (confirm("¿Eliminar este avance?")) {
      await deleteDoc(doc(db, "progresoGym", docId));
      div.remove();
    }
  };

  btnEditar.onclick = () => {
    const nuevoPeso = prompt("Nuevo peso (kg):", data.peso);
    const nuevasSeries = prompt("Nuevas series:", data.series);
    const nuevasReps = prompt("Nuevas repeticiones:", data.repeticiones);
    const nuevoComentario = prompt("Nuevo comentario:", data.comentario);

    if (nuevoPeso && nuevasSeries && nuevasReps) {
      updateDoc(doc(db, "progresoGym", docId), {
        peso: Number(nuevoPeso),
        series: Number(nuevasSeries),
        repeticiones: Number(nuevasReps),
        comentario: nuevoComentario
      }).then(() => {
        div.innerHTML = `
          <strong>${nuevoPeso} kg</strong><br>
          ${nuevasSeries} x ${nuevasReps}<br>
          <em>${nuevoComentario}</em><br>
          <button>📝 Editar</button>
          <button>🗑 Eliminar</button>
        `;
        mostrarAvance(container, {
          peso: nuevoPeso,
          series: nuevasSeries,
          repeticiones: nuevasReps,
          comentario: nuevoComentario
        }, docId);
      });
    }
  };

  container.appendChild(div);
}

window.addEventListener("DOMContentLoaded", async () => {
  const q = query(
    collection(db, "progresoGym"),
    where("usuario", "==", usuario),
    where("grupo", "==", grupo),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);
  const ejerciciosAgrupados = {};

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const ejercicio = data.ejercicio;
    if (!ejerciciosAgrupados[ejercicio]) ejerciciosAgrupados[ejercicio] = [];
    ejerciciosAgrupados[ejercicio].push({ ...data, id: docSnap.id });
  });

  Object.keys(ejerciciosAgrupados).forEach(nombreEjercicio => {
    agregarEjercicioUI(nombreEjercicio);
  });

  setTimeout(() => {
    Object.keys(ejerciciosAgrupados).forEach(nombreEjercicio => {
      const box = [...document.querySelectorAll(".ejercicio-box")].find(div =>
        div.querySelector("summary")?.textContent === nombreEjercicio
      );
      if (box) {
        const contenedor = box.querySelector(".avance-lista");
        ejerciciosAgrupados[nombreEjercicio].forEach(data => {
          mostrarAvance(contenedor, data, data.id);
        });
      }
    });
  }, 100);
});