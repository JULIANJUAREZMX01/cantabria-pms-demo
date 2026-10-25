/** Helper mínimo para construir DOM sin innerHTML: todo texto entra como textContent (los nombres vienen de la base). */
type Child = Node | string | null | false | undefined;
type Attrs = Record<string, string | boolean | ((ev: Event) => void) | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (typeof v === 'function') node.addEventListener(k.replace(/^on/, ''), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c) node.append(c);
  return node;
}

export const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document): T => {
  const n = root.querySelector<T>(sel);
  if (!n) throw new Error(`Elemento no encontrado: ${sel}`);
  return n;
};

export const money = (n: number): string => `$${n.toLocaleString('es-MX')}`;
