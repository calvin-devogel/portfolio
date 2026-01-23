import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { Github, Linkedin, Home, FileText, Codepen } from 'angular-feather/icons';

export const icons = {
  Github,
  Linkedin,
  Home,
  FileText,
  Codepen
}


@NgModule({
  declarations: [],
  imports: [
    FeatherModule.pick(icons),
    CommonModule
  ],
  exports: [
    FeatherModule
  ]
})
export class IconsModule { }
