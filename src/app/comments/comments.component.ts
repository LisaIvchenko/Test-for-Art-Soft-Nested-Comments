import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { IComments } from '../interfaces';
import { of, ReplaySubject } from 'rxjs';
import { ApiService } from '../api.service';
import { DatePipe } from '@angular/common';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { FormBuilder, FormControl } from "@angular/forms";
import { ToastrService } from "ngx-toastr";

@Component( {
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: [ './comments.component.scss' ]
} )
export class CommentsComponent implements OnInit, OnDestroy {

  // Массив комментариев
  public comments: IComments[];

  // Сабж для отписок
  private destroyed$: ReplaySubject<boolean> = new ReplaySubject( 1 );

  // Переменная, которая помогает свернуть reply textarea, если дважды кликнули по Reply
  private idOfReplyInput: number | null = null;

  // Индикатор загрузки
  public isLoading = false;

  public addNewCommentControl: FormControl;

  constructor( private readonly api: ApiService,
               private fb: FormBuilder,
               private toastr: ToastrService,
               private datePipe: DatePipe ) {
    this.comments = [];
    this.addNewCommentControl = fb.control('');
  }

  @HostListener( 'click', [ '$event' ] )
  onClick( event: MouseEvent ) {
    const target = event.target as HTMLTextAreaElement;
    const attr = target?.attributes as any;

    const isExpandReplyArea = /comment-expand-reply-button-/.test( attr.id?.nodeValue.toString() );
    const isReplyBtn = /reply-send-/.test( attr.id?.nodeValue.toString() );

    if (isReplyBtn) this.sendReply( attr );
    if (isExpandReplyArea) this.expandReplyArea( attr );
  }

  // Открытие новой textarea для ответа на комментарий
  private expandReplyArea( attributes: any ): void {
    this.closeOpenedReplyArea();
    const id = attributes.id?.nodeValue.toString().replace( 'comment-expand-reply-button-', '' )
    if (this.idOfReplyInput === id) {
      this.idOfReplyInput = null;
    } else {
      this.idOfReplyInput = id;
      // @ts-ignore
      document.getElementById( `comment-reply-wrapper-${ id }` ).innerHTML = this.getReplyInput( +id )
    }
  }

  // Отправка ответа на комментарий
  private sendReply( attributes: any ): any {
    const parent_id = attributes.id?.nodeValue.toString().replace( 'reply-send-', '' )
    // @ts-ignore
    const body = document.getElementById( `reply-textarea-${ parent_id }` ).value
    if (body) this.sendComment(body, parent_id);
  }

  // Закрытие открытой textarea
  private closeOpenedReplyArea(): void {
    const elements = document.getElementsByClassName( 'reply-input-wrapper' );
    while (elements.length > 0) {
      elements[ 0 ].parentNode?.removeChild( elements[ 0 ] );
    }
  }

  // Рекурсивная отрисовка дерева комментариев
  public drawNestedCommentsTree( data: IComments[], c: number ): string {
    let nestedComment = '';
    nestedComment += '<ul>';
    data.forEach( ( { parent_id, id, body, date_time, author_name } ) => {
      if (parent_id == c) {
        nestedComment += '<li>' + this.getCommentCard( author_name, date_time, body, id );
        nestedComment += this.drawNestedCommentsTree( data, id );
        nestedComment += '</li>';
      }
    } )
    nestedComment += '</ul>';
    return nestedComment;
  }

  // Генерируем html карточки комментария
  private getCommentCard( author: string, date: number, body: string, id: number ): string {
    const formattedDate = this.datePipe.transform( date * 1000, 'dd-MM-yyyy' );
    return `
      <div class='card bg-light mb-3'>
        <div class='card-header soft-green-bg d-flex justify-content-between text-white border-0'><span>${ author }</span><span>${ formattedDate }</span></div>
        <div class='card-body'>
          <p class='card-text'>${ body }</p>
          <a class='card-link pointer purple-gentle-color' id='comment-expand-reply-button-${ id }'>Reply</a>
        </div>
      </div>
      <div id='comment-reply-wrapper-${ id }'></div>
    `
  }

  // Генерируем html для области ответа на комментарий
  private getReplyInput( id: number ): string {
    const commentRecipientName = this.comments.find( comment => comment.id === id )?.author_name;
    return `
    <div class='input-group mb-3 mt-2 reply-input-wrapper'>
      <textarea class='form-control'  id='reply-textarea-${ id }'
      placeholder='Leave a comment to ${ commentRecipientName }' rows='3'></textarea>
      <button class='btn btn-outline-secondary' type='button' id='reply-send-${ id }'>Send</button>
    </div>`
  }

  // Получаем комментарии с 'сервера'
  private getComments(): void {
    const savedComments = JSON.parse( <string>localStorage.getItem( 'comments' ) );
    this.isLoading = true;
    this.api.getCommentsArray()
      .pipe(
        finalize( () => this.isLoading = false ),
        catchError( () => {
          console.log( 'Getting comments: error occurred. Try later :(' );
          return of( [] )
        } ),
        takeUntil( this.destroyed$ )
      )
      .subscribe( comments => {
          const allComments = [ ...comments, ...savedComments ];
          const uniqueIds = [ ...new Set( allComments.map( comment => comment.id ) ) ];
          this.comments = uniqueIds.map( id => allComments.find( comment => +comment.id === +id ) );
        }
      )
  }

  private sendComment(body: string, parent_id?: number): void {
    this.comments.push( {
      id: this.comments.length + 1,
      author_name: 'Teacup',
      parent_id: parent_id || 0,
      date_time: +(new Date()),
      body
    } )
    localStorage.setItem( 'comments', JSON.stringify( this.comments ) )
    this.toastr.success('Sent!', 'New comment:');
    this.addNewCommentControl.reset();
  }

  // Отправка комментария без родителя
  public sendNewComment(): void {
    const body = this.addNewCommentControl.value
    if (body) this.sendComment(body);
  }

  ngOnInit(): void {
    this.getComments();
  }

  // Отписки
  ngOnDestroy(): void {
    this.destroyed$.next( true );
    this.destroyed$.complete();
  }

}
