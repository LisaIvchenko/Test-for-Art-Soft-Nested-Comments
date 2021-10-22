import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { HttpClientModule } from "@angular/common/http";
import { SafeHtmlPipe } from "./safe-html.pipe";
import { CommonModule, DatePipe } from "@angular/common";
import { ArticleCardComponent } from './article-card/article-card.component';
import { CommentsComponent } from './comments/comments.component';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ToastrModule } from "ngx-toastr";

@NgModule( {
  declarations: [
    AppComponent,
    SafeHtmlPipe,
    ArticleCardComponent,
    CommentsComponent
  ],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ToastrModule.forRoot(),
  ],
  providers: [ DatePipe ],
  bootstrap: [ AppComponent ]
} )
export class AppModule {
}
