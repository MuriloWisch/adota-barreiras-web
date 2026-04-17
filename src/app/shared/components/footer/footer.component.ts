import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer>
      <div class="footer-inner">

        <div class="brand">
          <span class="paw">🐾</span>
          <div>
            <p class="brand-name">Adota Barreiras</p>
            <p class="tagline">Conectando corações em Barreiras</p>
          </div>
        </div>

        <div class="links">
          <a href="#">Sobre</a>
          <a href="#">Contato</a>
          <a href="#">Política de Privacidade</a>
        </div>

        <p class="copy">© {{ year }} Adota Barreiras. Todos os direitos reservados.</p>

      </div>
    </footer>
  `,
  styles: [`
    footer {
      background: #1E3A5F;
      color: #fff;
      padding: 40px 24px;
    }
    .footer-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; flex-direction: column;
      align-items: center; gap: 24px;
      text-align: center;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .paw { font-size: 32px; }
    .brand-name { font-size: 18px; font-weight: 700; }
    .tagline { font-size: 13px; color: rgba(255,255,255,0.65); margin-top: 2px; }
    .links { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
    .links a {
      color: rgba(255,255,255,0.75); font-size: 13px;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    .links a:hover { color: #4CAF50; }
    .copy { font-size: 12px; color: rgba(255,255,255,0.45); }
  `],
})
export class FooterComponent {
  year = new Date().getFullYear();
}