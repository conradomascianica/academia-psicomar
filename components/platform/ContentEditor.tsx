"use client";
import { useState } from "react";
import type { Curriculum, Quiz, Material, Lesson } from "@/lib/platform/types";
type FileOption = { id: string; nombre: string };
export function ContentEditor({
  initialCurriculum,
  initialQuiz,
  initialMaterials,
  files,
  tipo,
}: {
  initialCurriculum: Curriculum;
  initialQuiz: Quiz;
  initialMaterials: Material[];
  files: FileOption[];
  tipo: string;
}) {
  const [c, setC] = useState(initialCurriculum),
    [q, setQ] = useState(initialQuiz),
    [materials, setMaterials] = useState(initialMaterials);
  const id = () => crypto.randomUUID();
  const move = <T,>(items: T[], from: number, to: number) => {
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  };
  const updateLesson = (mi: number, li: number, values: Partial<Lesson>) =>
    setC({
      ...c,
      modulos: c.modulos.map((m, i) =>
        i !== mi
          ? m
          : {
              ...m,
              lecciones: m.lecciones.map((l, j) =>
                j !== li ? l : { ...l, ...values },
              ),
            },
      ),
    });
  const chooseFile = (value: string): Material => ({
    id: id(),
    archivoId: value,
    nombre: files.find((f) => f.id === value)?.nombre ?? "Material",
  });
  return (
    <>
      <input type="hidden" name="curriculum" value={JSON.stringify(c)} />
      <input type="hidden" name="evaluacion" value={JSON.stringify(q)} />
      <input
        type="hidden"
        name="materiales"
        value={JSON.stringify(materials)}
      />
      {tipo === "herramienta" && (
        <fieldset className="border rounded-lg p-5">
          <legend>Archivos del pack</legend>
          <ul>
            {materials.map((m) => (
              <li key={m.id} className="flex gap-3 py-2">
                {m.nombre}
                <button
                  type="button"
                  onClick={() =>
                    setMaterials(materials.filter((x) => x.id !== m.id))
                  }
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <label>
            Agregar archivo privado
            <select
              value=""
              onChange={(e) => {
                if (e.target.value)
                  setMaterials([...materials, chooseFile(e.target.value)]);
              }}
            >
              <option value="">Seleccioná un archivo cargado</option>
              {files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      )}
      {tipo === "curso" && (
        <>
          <fieldset className="border rounded-lg p-5 space-y-4">
            <legend>Encuentro en vivo (opcional)</legend>
            <label>
              Google Meet o Zoom
              <input
                type="url"
                value={c.liveUrl ?? ""}
                onChange={(e) =>
                  setC({ ...c, liveUrl: e.target.value || undefined })
                }
              />
            </label>
            <label>
              Fecha y hora con zona (ISO)
              <input
                value={c.liveAt ?? ""}
                placeholder="2026-10-10T18:00:00Z"
                onChange={(e) =>
                  setC({ ...c, liveAt: e.target.value || undefined })
                }
              />
            </label>
            <label>
              Cupo (vacío: sin límite)
              <input
                type="number"
                min={1}
                value={c.cupo ?? ""}
                onChange={(e) =>
                  setC({
                    ...c,
                    cupo: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </label>
          </fieldset>
          <h2 className="text-2xl">Módulos y clases</h2>
          {c.modulos.map((m, mi) => (
            <fieldset
              className="border border-mar-300 rounded-xl p-5 space-y-5"
              key={m.id}
            >
              <legend>Módulo {mi + 1}</legend>
              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={mi === 0}
                  className="underline disabled:opacity-40"
                  onClick={() =>
                    setC({ ...c, modulos: move(c.modulos, mi, mi - 1) })
                  }
                >
                  Subir módulo
                </button>
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    setC({
                      ...c,
                      modulos: c.modulos.filter((x) => x.id !== m.id),
                    })
                  }
                >
                  Quitar módulo
                </button>
              </div>
              <label>
                Nombre del módulo
                <input
                  value={m.titulo}
                  onChange={(e) =>
                    setC({
                      ...c,
                      modulos: c.modulos.map((x, i) =>
                        i === mi ? { ...x, titulo: e.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              {m.lecciones.map((l, li) => (
                <details key={l.id} className="border rounded-lg p-4" open>
                  <summary>
                    Clase {li + 1}: {l.titulo || "Nueva clase"}
                  </summary>
                  <div className="space-y-4 mt-4">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        disabled={li === 0}
                        className="underline disabled:opacity-40"
                        onClick={() =>
                          setC({
                            ...c,
                            modulos: c.modulos.map((x, i) =>
                              i === mi
                                ? {
                                    ...x,
                                    lecciones: move(x.lecciones, li, li - 1),
                                  }
                                : x,
                            ),
                          })
                        }
                      >
                        Subir clase
                      </button>
                      <button
                        type="button"
                        className="underline"
                        onClick={() =>
                          setC({
                            ...c,
                            modulos: c.modulos.map((x, i) =>
                              i === mi
                                ? {
                                    ...x,
                                    lecciones: x.lecciones.filter(
                                      (y) => y.id !== l.id,
                                    ),
                                  }
                                : x,
                            ),
                          })
                        }
                      >
                        Quitar clase
                      </button>
                    </div>
                    <label>
                      Título
                      <input
                        value={l.titulo}
                        onChange={(e) =>
                          updateLesson(mi, li, { titulo: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Contenido
                      <textarea
                        rows={5}
                        value={l.texto}
                        onChange={(e) =>
                          updateLesson(mi, li, { texto: e.target.value })
                        }
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        Video
                        <select
                          value={l.videoProvider ?? ""}
                          onChange={(e) =>
                            updateLesson(mi, li, {
                              videoProvider: (e.target.value ||
                                undefined) as Lesson["videoProvider"],
                            })
                          }
                        >
                          <option value="">Sin video</option>
                          <option value="youtube">YouTube</option>
                          <option value="vimeo">Vimeo</option>
                        </select>
                      </label>
                      <label>
                        Identificador del video
                        <input
                          value={l.videoId ?? ""}
                          onChange={(e) =>
                            updateLesson(mi, li, {
                              videoId: e.target.value || undefined,
                            })
                          }
                        />
                      </label>
                    </div>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={l.requerida}
                        onChange={(e) =>
                          updateLesson(mi, li, { requerida: e.target.checked })
                        }
                      />
                      Clase requerida para completar el curso
                    </label>
                    <ul>
                      {l.materiales.map((f) => (
                        <li key={f.id} className="py-2">
                          {f.nombre}{" "}
                          <button
                            type="button"
                            className="underline"
                            onClick={() =>
                              updateLesson(mi, li, {
                                materiales: l.materiales.filter(
                                  (x) => x.id !== f.id,
                                ),
                              })
                            }
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                    <label>
                      Agregar material
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value)
                            updateLesson(mi, li, {
                              materiales: [
                                ...l.materiales,
                                chooseFile(e.target.value),
                              ],
                            });
                        }}
                      >
                        <option value="">Seleccioná un archivo</option>
                        {files.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </details>
              ))}
              <button
                type="button"
                className="underline"
                onClick={() =>
                  setC({
                    ...c,
                    modulos: c.modulos.map((x, i) =>
                      i === mi
                        ? {
                            ...x,
                            lecciones: [
                              ...x.lecciones,
                              {
                                id: id(),
                                titulo: "",
                                texto: "",
                                requerida: true,
                                materiales: [],
                              },
                            ],
                          }
                        : x,
                    ),
                  })
                }
              >
                + Agregar clase
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="underline text-left"
            onClick={() =>
              setC({
                ...c,
                modulos: [
                  ...c.modulos,
                  { id: id(), titulo: "Nuevo módulo", lecciones: [] },
                ],
              })
            }
          >
            + Agregar módulo
          </button>
          <h2 className="text-2xl mt-8">Evaluación final</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Aprobación (%)
              <input
                type="number"
                min={1}
                max={100}
                value={q.aprobacion}
                onChange={(e) =>
                  setQ({ ...q, aprobacion: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Máximo de intentos
              <input
                type="number"
                min={1}
                max={20}
                value={q.intentos}
                onChange={(e) =>
                  setQ({ ...q, intentos: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={q.requerirContenidos}
              onChange={(e) =>
                setQ({ ...q, requerirContenidos: e.target.checked })
              }
            />
            Requerir completar clases para emitir certificado
          </label>
          {q.preguntas.map((p, pi) => {
            const change = (v: Partial<typeof p>) =>
              setQ({
                ...q,
                preguntas: q.preguntas.map((x, i) =>
                  i === pi ? { ...x, ...v } : x,
                ),
              });
            return (
              <fieldset className="border rounded-lg p-5 space-y-4" key={p.id}>
                <legend>Pregunta {pi + 1}</legend>
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    setQ({
                      ...q,
                      preguntas: q.preguntas.filter((x) => x.id !== p.id),
                    })
                  }
                >
                  Quitar pregunta
                </button>
                <label>
                  Enunciado
                  <input
                    value={p.texto}
                    onChange={(e) => change({ texto: e.target.value })}
                  />
                </label>
                <label>
                  Tipo
                  <select
                    value={p.tipo}
                    onChange={(e) =>
                      change({
                        tipo: e.target.value as typeof p.tipo,
                        correctas: [],
                        opciones:
                          e.target.value === "vf"
                            ? [
                                { id: "v", texto: "Verdadero" },
                                { id: "f", texto: "Falso" },
                              ]
                            : p.opciones,
                      })
                    }
                  >
                    <option value="unica">Una respuesta</option>
                    <option value="multiple">Selección múltiple</option>
                    <option value="vf">Verdadero / falso</option>
                  </select>
                </label>
                {p.opciones.map((opt, oi) => (
                  <div className="flex items-center gap-3" key={opt.id}>
                    <input
                      type="checkbox"
                      aria-label={`Correcta: opción ${oi + 1}`}
                      checked={p.correctas.includes(opt.id)}
                      onChange={(e) =>
                        change({
                          correctas: e.target.checked
                            ? p.tipo === "multiple"
                              ? [...p.correctas, opt.id]
                              : [opt.id]
                            : p.correctas.filter((x) => x !== opt.id),
                        })
                      }
                    />
                    <label className="flex-1">
                      Opción {oi + 1}
                      <input
                        value={opt.texto}
                        onChange={(e) =>
                          change({
                            opciones: p.opciones.map((x, i) =>
                              i === oi ? { ...x, texto: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    </label>
                  </div>
                ))}
                {p.tipo !== "vf" && p.opciones.length > 2 && (
                  <button
                    type="button"
                    className="underline"
                    onClick={() =>
                      change({
                        opciones: p.opciones.slice(0, -1),
                        correctas: p.correctas.filter(
                          (id) => id !== p.opciones.at(-1)!.id,
                        ),
                      })
                    }
                  >
                    Quitar última opción
                  </button>
                )}
                {p.tipo !== "vf" && (
                  <button
                    type="button"
                    className="underline"
                    onClick={() =>
                      change({
                        opciones: [...p.opciones, { id: id(), texto: "" }],
                      })
                    }
                  >
                    + Agregar opción
                  </button>
                )}
                <label>
                  Puntos
                  <input
                    type="number"
                    min={1}
                    value={p.puntos}
                    onChange={(e) => change({ puntos: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Explicación después de responder
                  <textarea
                    value={p.feedback}
                    onChange={(e) => change({ feedback: e.target.value })}
                  />
                </label>
              </fieldset>
            );
          })}
          <button
            type="button"
            className="underline text-left"
            onClick={() =>
              setQ({
                ...q,
                preguntas: [
                  ...q.preguntas,
                  {
                    id: id(),
                    texto: "",
                    tipo: "unica",
                    opciones: [
                      { id: id(), texto: "" },
                      { id: id(), texto: "" },
                    ],
                    correctas: [],
                    puntos: 1,
                    feedback: "",
                  },
                ],
              })
            }
          >
            + Agregar pregunta
          </button>
        </>
      )}
    </>
  );
}
